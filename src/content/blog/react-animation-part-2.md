---
title: "Animation in React - Tools - Part 2"
date: 2020-05-10
excerpt: JavaScript tools for animations in React
---

In [Part 1](/blog/react-animation-part-1), we looked at CSS animation techniques, and how to use them in a CSS-in-JS React world. But we identified a few limitations of this approach, which leads us to need some JavaScript tools in our armoury. The limitations were:
* Animations coordinated between elements
* Realistic motion (ish)
* Animations driven by numeric/continuous values, rather than discrete values

### Coordinating animation between elements
We can sequence animations between different elements with CSS transitions using delays (i.e. delay the animation of one element until the first element's animation is complete). However, this can get unwieldy if we're doing a lot of this (lots of elements, lots of animation, staggering/chaining animations).
```js
const Container = styled.div`
  display: flex;
  height: 50px;
  width: 500px;
  position: relative;
  justify-content: flex-end;
`;
const Dot = styled.div`
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: palevioletred;
  left: 0;
  top: 20px;
  z-index: 10;
  transition: transform 300ms;
  ${props =>
    props.activate &&
    css`
      transform: translateX(470px);
    `};
`;
const pulse = keyframes`
0% {
  transform: scale(1);
}
50% {
  transform: scale(1.5);
}
100% {
  transform: scale(1);
}
`;
const Target = styled.div`
  border-radius: 50%;
  height: 50px;
  width: 50px;
  background-color: papayawhip;
  ${props =>
    props.activate &&
    css`
      animation: 200ms ${pulse};
      animation-delay: 300ms;
    `};
`;
const DotToTarget = ({ activate }) => {
  return (
    <Container>
      <Dot activate={activate} />
      <Target activate={activate} />
    </Container>
  );
};
```
[CodeSandbox](https://codesandbox.io/s/cold-wood-jg3ui?file=/src/App.js:124-1069)

Here we have a dot which moves to a target, which pulses when it gets there. But it feels quite imperative, rather than being React-y. We only want the Target to animate when it moves, rather than initially if we're already activated. React transition group has something which could help with this, but it's getting even more complicated.

This sequencing also depends on the animations having fixed (or at least known calculated) durations, which brings the next point.

### Realistic motion
Motion in the real world adheres more to spring-based physics rather than duration, so spring-based animations _feel_ more natural to users. The duration of a spring-based animation is hard to calculate.

The CSS timing functions can allow us relatively close to spring-based physics for some animations. Sometimes, a bezier curve can be a pretty good approximation (e.g. in [react-beautiful-dnd](https://medium.com/@alexandereardon/grabbing-the-flame-290c794fe852)). Or you can use keyframes to [simulate a spring](https://www.npmjs.com/package/css-spring). I've tried these and they do work, but they still give imperfect static approximations - at some point, you're still assigning the animation a duration, which will either be constant or you'll need to calculate, which may be non-trivial (e.g. duration of a "snap back" animation based on drop point).

In JavaScript-land, we can do the actual maths behind a spring.

###
 Numeric values
Imagine we're building a progress bar component, where we expect the progress updates to be "blocky", but we don't want to just jump directly from one value to another.

```js
const Container = styled.div`
  height: 50px;
  width: 500px;
  padding: 2px;
  border: 1px solid black;
`
const Bar = styled.div`
  transition: width 50ms;
  height: 46px;
  background-color: green;
  width: ${props => props.progress * 500}px;
`
const ProgressBar = ({progress}) => (
  <Container>
   <Bar progress={progress} />
  </Container>
)
```
_I've used prop interpolation with a number here, which isn't great (new class for every value!). The same could equally be achieved with a width calculated as a style._

That'll work, but there's a few issues with it:
* The transition duration is constant, whether we've jumped 2% or 50%
  * We could help this by calculating a new duration using the previous progress value, but that's a bit fiddly.
* We're animating `width`, which wasn't one of the [good animation properties](https://www.html5rocks.com/en/tutorials/speed/high-performance-animations/)
  * We can work around this by making the progress bar have width 1px, and then animate scaling it in the x direction only, and setting the transform origin to the left edge.
* We have to do a new render every time the progress changes. If the changes are less blocky, this is a lot of JavaScript work for React to do the reconciliation.
  * If the progress was actually linked to our scroll position, for instance, we'd be killing scroll performance, which is a big no no.

So we can do something in CSS, but JavaScript-land looks appealing.

## React Spring
[React Spring](https://www.react-spring.io/) is my favourite React animation library. It has a simple but powerful API, which does bear some similarity to the React Native Animated (and Reanimated) library. Go to the link and see some of the stuff they've done!

I find it particularly powerful when handling scroll-linked animations. Let's try to implement that progress bar component using it, using the companion [react-use-gesture](https://github.com/react-spring/react-use-gesture) library.

```js
const Container = styled.div`
  height: 50px;
  width: 500px;
  padding: 2px;
  border: 1px solid black;
`
const Bar = styled(animated.div)`
  transition: width 50ms;
  height: 46px;
  background-color: green;
`
const ProgressBar = ({progress}) => (
  <Container>
   <Bar style={{width: progress.interpolate(val => val * 500)}} />
  </Container>
)

const App = () => {
  const [{progress}, setProgress] = useSpring(() => ({progress: 0}))
  const bind = useScroll(({xy}) => setProgress({progress: xy[1] / HEIGHT}))

  return (
    <>
      <animated.main {...bind()}>SOME CONTENT</animated.main>
      <ProgressBar progress={progress} />
    </>
  )
}
```
That is a performant scroll listener! At first, it looks as though this is going to be triggering a new React renderfor every frame, when `progress` gets updated. But actually, `progress` is an object (an AnimatedValue), which `animated.div` knows how to interpret. It will update the style on the actual DOM element, bypassing the React render cycle. This is key to its performance - React is fast, but bypassing React when we can is even faster.

Underneath, the DOM is being updated a lot of times in succession with an updated style tag. So we still want to make it easy for the browser to render this by sticking to the cheap animation properties where possible.

React Spring also has an alternative primitive to React transition group for component mount/unmount animations, and special primitives to help us stagger/chain animations.

Good for:
* Complex animations, particularly with multiple elements
* Scroll/Drag-triggered animations

Less good for:
* Top performance (but still great!)
* Simple things, particularly where bundle size is critical (use CSS if that's all you need!)

## Other tools
There are lots of great animation libraries for React (web/DOM), some of which are listed below. I don't have so much experience with these!
* [Framer Motion](https://www.framer.com/motion/)
  * Successor to Pose
* [React Motion](https://github.com/chenglou/react-motion)
  * Inspired some of the React Spring API, but doesn't bypass the React render loop
* [React Flip Move](https://github.com/joshwcomeau/react-flip-move) [React Flip Toolkit](https://github.com/aholachek/react-flip-toolkit)
  * React flip move is great for its specific purpose (list animations), React flip toolkit looks really powerful, might investigate for a shared element transition.
* [React Particle Effect Button](https://github.com/transitive-bullshit/react-particle-effect-button)
  * Looks really cool. Might have to look into this... Doing some fun stuff with a Canvas.
* [React Sheltr](https://github.com/TaitoUnited/react-sheltr)
  * I'm looking for an example of a shared element animation that I want to implement, this might be what I use to do it.

Obviously we _could_ throw all of these in to do different animations in an application, but that would give us a huge bundle. So best to choose one (or maybe two) for a project and stick with it.


The next few posts are going to include some examples of using these tools to achieve some animations from around the web and mobile apps. Until then, have a look at the [Projects page](/).

More links:
* https://medium.com/@alexandereardon/dragging-react-performance-forward-688b30d40a33 has some interesting animation performance notes.
* https://github.com/wcandillon/ kind of my hero when it comes to animation in React (focussed on React Native).
* [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions/Using_CSS_transitions) has the best web developer docs. Don't use w3schools.
