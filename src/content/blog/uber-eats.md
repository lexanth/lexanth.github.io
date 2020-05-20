---
title: "Animation in React - Uber Eats"
date: 2020-05-20
excerpt: The Uber Eats app menu page for the web
---

I tend to see a lot more care going into animations in native apps that web applications. For example, React Navigation comes with animation built in. Part of this is just an expectation thing - people expect the animations in the native experience. Part of it is also the variable platform that the web represents; there's a whole lot of different devices/browsers out there! This all just makes it more of a challenge!

It's particularly interesting when comparing the mobile and web apps from the same company. Depending on the company, there's a good chance these are developed by different teams, but at least the designers are probably communicating!

![Uber Eats App](../../images/UberEats.gif)

_Another laggy gif..._

The menu page for the Uber Eats native app has (had?) this collapsible header, with a section indicator underneath using this masking effect. On the web, they've got a slightly different collapsible header (it doesn't show the restaurant name, and no masking effect). Also the scroll indicator doesn't seem to work at all on Desktop Firefox, but it does on Chrome for Android. So can we do it? And what are the trade offs?

Once again, I was put onto this idea from [Can it be done in React Native?](https://www.youtube.com/watch?v=xutPT1oZL2M). I've taken some ideas from there, but the different native and web tools make the approaches diverge somewhat.

## Breaking down the animation
From the animation, we can see three components.
* There's the collapsible header, transitioning between the restaurant details and hero image into the restaurant name and section tabs.
* Then there's the section tabs themselves, with the current tab highlighted and becoming the left-most tab.
* Finally, there is using the tab header to drive the actual scroll position of the rest of the menu.

## Tools
Another scroll-based animation, so we're going to be in JavaScript-land. This looks like another job for react-spring and react-use-gesture. It seems like it's going to be quite similar to the [Spotify Scrolling Header](https://www.youtube.com/watch?v=XOYsWZ-4Zsg&t=3s).

The way that the text in the tab bar can be cut off by the black overlay looks like masking again, so we should be able to do that by animating `clipPath`. And it's approximately rectangular (with rounded corners), so we shouldn't need the `url()` hack we used in [LiquidSwipe](/blog/liquid-swipe).

As ever, I use a starter based on `create-react-app`, with my preferred dev tools (prettier...) and `styled-components` for CSS.

## Basic Setup
Our basic DOM structure is dictated by which bits move and which don't. While we can move elements around in response to scrolling, it's going to be more performant to let the browser do it. So elements that move with the scroll go in a container which can overflow, fixed elements (the tab bar) go outside the overflowing element.
```ts
const Content = styled.div`
  overflow-y: auto;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #efefef;
`

const App: React.FC = () => {
  return (
    <AppContainer>
      <GlobalStyle />
      <FixedHeader />
      <Content>
        <HeaderImage src={restaurant.image} />
        <RestaurantDetails details={restaurant} />
        <Menu menu={menu} />
      </Content>
    </AppContainer>
  )
}
```
`FixedHeader`, `HeaderImage`, `RestaurantDetails` and `Menu` are all pretty much just standard presentational components with a little styling. The only thing worth noting is that the `HeaderImage` has padding beneath it, representing where the restaurant name should be. We only have the restaurant name itself in `FixedHeader`, and we're going to move it into position in this gap.

## Collapsible Header
The first thing we need to do is track the scroll position. This is going to be our classic `useSpring` and `react-use-gesture` combo:
```ts
const [{ y }, setScrollPos] = useSpring(() => ({ y: 0 }))
const bind = useScroll(({ xy }) => {
  setScrollPos({ y: xy[1], immediate: true })
})
...
<Content {...bind()}>
  <HeaderImage src={restaurant.image} />
  <RestaurantDetails details={restaurant} />
  <Menu menu={menu} />
</Content>
```
I've used `immediate: true` to make the y value immediate rather than using spring physics - we want our scroll animation to be really snappy.

The first thing we want to do is put the restaurant name in the gap we left for it. We can pass `y`, our scroll position, into the `FixedHeader` and use that to calculate the position. When we're scrolled to the top, we want the restaurant name to be moved down by the height of the header image. When we've completely scrolled the header image off the screen, we want the restaurant name in its normal position, and as we continue scrolling past this we don't want it to move. So this is an interpolation on the scroll position, with a clamp to stop it going past the end.
```ts
const titlePosition = y.interpolate({
  range: [0, IMAGE_HEIGHT],
  output: [`translateY(${IMAGE_HEIGHT}px)`, `translateY(0px)`],
  extrapolate: 'clamp'
})
...
<Title style={{transform: titlePosition}}>{title}</Title>
```

For every pixel we scroll down, we reduce the `translateY` by a pixel. And as `y` is updating immediately, it looks like the title is moving with the scroll. This is a bit different to the approach we used for Spotify, where we had the title twice, with one fading in and the other out as they went past eachother.

The next problem is that the section tabs should only be visible when we've scrolled past the header image. This is therefore another function of the scroll position, `y`.

```ts
const tabHeaderOpacity = y.interpolate({
  range: [IMAGE_HEIGHT - 1, IMAGE_HEIGHT],
  output: [0, 1],
  extrapolate: 'clamp' // No point in an opacity outside the range 0-1!
})
...
<TabHeader style={{opacity: tabHeaderOpacity}}>
```

This works, but the tab header just appears instantly as we scroll past, rather than fading in. We could give a wider input range for the interpolation, but that means we can stop scrolling with the tabs with an opacity between zero and 1.

The solution here is to create another animated value which just represents whether we have scrolled past the header, and allow it to use a spring to give a fade in/out.

```ts
const [{ y }, setScrollPos] = useSpring(() => ({ y: 0 }))
const [ { scrolledPastHeader }, setScrolledPastHeader] = useSpring(() => ({
  scrolledPastHeader: 0
}))
const bind = useScroll(({ xy }) => {
  setScrollPos({ y: xy[1], immediate: true })
  setScrolledPastHeader({scrolledPastHeader: xy[1] >= IMAGE_HEIGHT ? 1 : 0})
})
```
We can now use `scrolledPastHeader` directly as our opacity. It will spring from 0 to 1 gradually, but never rest anywhere in between.

We've now got the tabs fading in and out, let's make them actually work!

## Section scroll tracking
Before we can think about highlighting the active tab, we need to start tracking the active tab. This is the last tab whose title we have already started to scroll past. So this is comparing the scroll position (which we're already listening to) to the positions of the section headers in the menu. To do the latter, we need to actually measure the elements as they're laid out, as the section heights vary with the menu and the screen size.

To do this, I'm going to use `react-measure`. This adds an `onResize` callback to a component, which we can use to report back the section offsets.
```ts
const MenuSection = styled.section`
  padding: 10px;
`
const MeasuredSection = withContentRect(
  'offset'
)(({ measureRef, ...props }) => <MenuSection ref={measureRef} {...props} />)

export const Section = ({ onLayout, index, ...props }: Props) => {
  return <MeasuredSection onResize={({offset}) => onLayout(index, offset)} {...props} />
}
```

We can then collect the offsets from all of the sections in our top level component (`App` here). We need to persist these, so we can put them in state or in a ref (refs are just holders for a reference, they don't have to be used for references to DOM elements).

```ts
const tabScrollAnchors = useRef(menu.map(_ => 0))
const handleLayout = (index, offset) => {
  tabScrollAnchors.current[index] = offset.top
}
```
We'd also need something to update the length of the array if the menu changes, but we can leave that for now in our simple example.

Next we want to calculate the active tab index from these anchors and the scroll position. We could do this with a loop or use `reduce`.
```ts
const getActiveTabIndex = (y, tabScrollAnchors) => tabScrollAnchors.reduce((acc, curr, i) => {
  return y + MIN_HEADER_HEIGHT + SCROLL_OFFSET >= curr ? i : acc
}, 0)
```
If the scroll position (`y`) is past the top of the current section, use that section's index. Otherwise, ignore this section. As long as we consider the sections in order, we get the last section that we've scrolled past. I've also added an allowance for the height of the collapsed header (`MIN_HEADER_HEIGHT`) and an extra trial and error margin so that it changes slightly after the title is passed.

Alternatively, we could have done this by interpolating `y` between the scroll anchors, with the indexes as the output.
```ts
const activeTabIndex = y.interpolate({
  range: tabScrollAnchors.current.map(anchor => anchor - MIN_HEADER_HEIGHT - SCROLL_OFFSET),
  output: tabScrollAnchors.current.map((_, i) => i)
  extrapolate: 'clamp'
})
```
However, this would have restricted us to having `activeTabIndex` be as springy as `y`, which we wanted to be immediate. Using a separate animated value allows us more flexibility here.
```ts
const [{ activeTabIndex }, setActiveTabIndex] = useSpring(() => ({ activeTabIndex: 0 }))
const bind = useScroll(({ xy }) => {
  setScrollPos({ y: xy[1], immediate: true })
  setScrolledPastHeader({scrolledPastHeader: xy[1] >= IMAGE_HEIGHT ? 1 : 0})
  setActiveTabIndex({ activeTabIndex: getActiveTabIndex(xy[1], tabScrollAnchors.current)})
})
```

## Tab movement
There are two aspects to the tab response to scrolling: the black active tab indicator resizes for the active tab title and the section titles themselves move so that the active one is left-most. Let's start with the movement.

This would be easy if our tabs were fixed width - we have the index, so just move them `index * tab width` to the left. However, a quick look through some Uber Eats restaurants shows that the section titles sometimes get quite long. Instead, we can measure the widths of the section tabs and use that to move them - total all of the widths of tabs to the left of the active one.

For measuring the tabs, we can use the same technique as we used for measuring the offsets for the section headers in the menu.
```ts
const MeasuredTab = withContentRect('bounds')(
  ({ measureRef, ...props}) => <BaseTab ref={measureRef}>{...props}</BaseTab>
)
const MeasurableTab = ({ onBoundsChange, index }) => {
  return <MeasuredTab onResize={({bounds}) => onBoundsChange(index, bounds)} {...props} />
}

...
const tabWidths = useRef(menu.map(_ => 0))
const handleBoundsChange = (index, bounds) => {
  tabWidths.current[index] = bounds.width
}
```

Next we want to use these tab widths, along with our active tab index animated value, to calculate the x offset.
```ts
const transform = activeTabIndex.interpolate(index => `translateX(-${
  tabWidths.current.reduce((acc, curr, i) => (i < index ? acc + curr + 2 * TAB_PADDING : acc))
}px)`)
...
<TabsContainer style={{ transform }}>
```
We could optimise this a bit (e.g. we don't need to calculate the cumulative widths every frame), but it's at least giving us the right animation.

## Tab highlighting
This is the trickiest bit of the whole thing, and it's the bit that the Uber Eats web app doesn't do.

As mentioned before, it's clearly using masking to get the black tab indicator with white text to overlay the black text as it moves. To get the effect right as it moves, the white text actually needs to be moving at the same time as the black text. We therefore need to render two strips of tabs - one black text on white, one white text on black - and we'll clip the white on black one to only show for the active tab. We only need to measure one set of tabs, because we know they'll be the same size.

```ts
const OverlayTabsContainer = styled(TabsContainer)`
  background-color: black;
  color: white;
`
...
return (
  <>
    <TabsContainer style={{ transform }}>
      {menu.map(({name}, i) => (
        <MeasurableTab
          key={name}
          index={i}
          onBoundsChange={handleBoundsChange}
        >
          {name}
        </MeasurableTab>
      ))}
    </TabsContainer>
    <OverlayTabsContainer style={{ transform }}>
      {menu.map(({name}, i) => (
        <BaseTab key={name}>
          {name}
        </MeasurableTab>
      ))}
    </OverlayTabsContainer>
  </>
)
```

Now that we've got the black tab bar fixed over the white one (and both moving together), we can clip the black tab bar to just the active item. As a first pass, we can just set up a static style:
```ts
const tabWidth = 200
const clipPath = `inset(0 calc(100% - ${tabWidth + 2 * TAB_PADDING}px) 0 0 round ${2 * TAB_PADDING}px)`
...
<OverlayTabsContainer style={{ transform, clipPath }}>
```
We have to use `calc(100% - val)` as the values represent an inset from the edge of the whole container.

That looks about right for the first one, but obviously doesn't have the right tab width, and the clipped part moves off screen when we transform the tabs.

One solution to the latter is that we transform the tabs, rather than the tab container. This means doing slightly more work, so we only do it for the overlay tabs. Alternatively, we could nest another container and translate that; not sure which is going to be more performant. Another solution would be to calculate the clip path to allow for the transform - currently we just inset from the right, we could inset partially from the left and the right.

Getting the right tab width just needs some more interpolating on the active tab index animated value. This is good as it means that our tab indicator size and our tab movement will be synchronised.
```ts
const clipPath = activeTabIndex
  .interpolate({
    range: tabWidths.current.map((_, i) => i)
    output: tabWidths.current
  })
  .interpolate(tabWidth => {
    const overlayWidth = tabWidth + 2 * TAB_PADDING
    return `inset(0 calc(100% - ${overlayWidth}px) 0 0 round ${2 * TAB_PADDING})`
  })
...
return (
  <>
    <TabsContainer style={{ transform }}>
      {menu.map(({name}, i) => (
        <MeasurableTab
          key={name}
          index={i}
          onBoundsChange={handleBoundsChange}
        >
          {name}
        </MeasurableTab>
      ))}
    </TabsContainer>
    <OverlayTabsContainer style={{ clipPath }}>
      {menu.map(({name}, i) => (
        <BaseTab key={name} style={{ transform }} as={animated.div}>
          {name}
        </MeasurableTab>
      ))}
    </OverlayTabsContainer>
  </>
)
```

Phew! The tab bar now responds nicely to scrolling. Now we just need to make the tabs clickable to drive the scroll!

## Clickable tabs
When we click a section tab, we just need to scroll the content to bring that section into focus. Fortunately, we already know how far down each section is - we've got the `tabScrollAnchors` saved off. We just need a ref to the content container to allow us to imperatively scroll it.
```ts
const contentContainer = useRef()
const handleTabClick = index => {
  if (contentContainer.current) {
    contentContainer.current.scrollTo({
      top: tabScrollAnchors.current[index] - MIN_HEADER_HEIGHT - SCROLL_OFFSET
    })
  }
}
...
<Content {...bind()} ref={contentContainer}>
```
Everything else in the UI is already driven by the scroll position, so updating the scroll position should bring it back round.

## Cross browser testing
On my laptop, that works great. On my phone (Nexus 5X), there's a lot of stuttering as the restaurant name moves. I switched this to render the restaurant name both in the scrollable and fixed headers, and just switch them (by opacity) as one went past the other.

In Chrome, the tab highlighting wasn't working too well. On investigation, it wasn't updating the interpolation config when the tabs reported their sizes, because updating refs doesn't force a re-render. I switched this to use state instead. Once this was sorted, it all seemed to work. There's the occasional bit of lag - it looks like this is pushing the mobile browser on my "top of the range-ish 4 years ago" phone towards the limit. The Android Uber Eats app doesn't use the masking, and it waits for the scrolling to be inactive to update the activeTabIndex.

## Putting it all together
<iframe
     src="https://codesandbox.io/embed/strange-noether-57n3p?fontsize=14&hidenavigation=1&module=%2Fsrc%2FApp.js&theme=light"
     style="width:100%; height:700px; border:0; border-radius: 4px; overflow:hidden;"
     title="strange-noether-57n3p"
     allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
     sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
   ></iframe>

## Things we could change
Rather than translating the tab bar off to the left, we could make it overflow and scroll it off to the left, with the overlay being driven by this scroll position.
