---
title: "Animation in React - Tools - Part 1"
date: 2020-05-09
excerpt: What I use to do animation in React and why.
---

React's fundamental principle is UI as a function of state. The state changes, we re-render and get a new UI.

This seems obvious, but when I first dipped my toe into JavaScript, it was some jQuery. Rather than declaratively saying what the UI should look like, you imperatively manipulated the UI. Button clicked - move that there. User types - show message. This caused all sorts of challenges that React helps address, like an explosion of complexity as more features are added.

But it did have one thing going for it - it was a very obvious point to add animation. Move that there becomes _slide_ that there. Show message becomes _fade in_ message. React doesn't immediately give us anywhere to tell it _how_ to transform one UI (i.e. a render output) to another, it just works out the required changes and updates the DOM. So we need some extra help.

A major challenge with web animations is often performance. End users are very likely to have worse hardware than we're developing on; it might be old, it might be mobile, it might be old and mobile, or worst of all, it might be IE... So I've picked a toolkit for animations with an eye on performance.

I have two preferred techniques for adding animation: CSS animations and React Spring. There are others which I'll touch on at the end.

## CSS Animations
When writing CSS for my React apps, I prefer to use `styled-components`. CSS-in-JS makes a lot of sense to me, I like to keep all the code for delivering something in the same place if possible, so I don't see an immediate need to split it into a separate file based on technology. I also find that declaring everything effectively as a component encourages me to reuse bits more than e.g. CSS modules. And it just works. But everything I talk about in the rest of this would work with a different CSS-in-JS solution or separate CSS files.

Performance-wise, browsers are already well optimised for CSS. Lots of properties are [animatable](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animated_properties), but there are certain properties that they're better at animating [position, scale, rotation and opacity](https://www.html5rocks.com/en/tutorials/speed/high-performance-animations/). If we stick to these guys, we can be pretty confident that we can get nice smooth animations.

CSS has two main ways to introduce animation, the `transition` and `animation` properties.

### Transitions
The `transition` property defines how changes in other CSS properties get applied. By default, if you change another property (e.g. by applying another class or a pseudo-class), it just gets applied immediately. But with a `transition` we can get it applied gradually, with the browser automatically calculating the intermediate steps.

```js
const Button = styled.button`
  background-color: papayawhip;
  transition: transform 200ms;
  transition: background-color 500ms;
  &:hover {
    transform: scale(1.2);
  }
  ${props => props.active && `
    background-color: palevioletred;
  `};
`
```
This button component will grow slightly when hovered (when the `:hover` pseudo-class is applied) and turn palevioletred when the `active` prop is true. In the actual implementation, this corresponds to a different class being applied with the new background colour. The transitions will be applied linearly (the default) over 200 and 500 milliseconds respectively. We could add delays to the animation, or use different [timing functions](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-timing-function).

The hover effect is applied without React needing to do a re-render. The active state is applied with a single re-render updating the `active` prop, with the browser calculating all of the intermediate states. All in all, we're not executing much JavaScript to make these animations work, so we can assume they'll be fast.

Good for:
* Simple transitions between states
* High performance

Less good for:
* Components being added/removed
* Sequencing multiple animations
* Realistic motion (more later...)

### Keyframe Animations
Some animations, particularly more decorative ones, aren't just a simple direct transition between two states. Some animations run continuously (preferably with restraint...), others we may just want more control over the path between states. This is where keyframe animations come in.

The first problem we can solve with this is the fade in of a new element. CSS transitions can't do this, because the element must have been rendered with the initial styles to then update them.
```js
const fadeIn = keyframes`
from {
  opacity: 0;
}
to {
  opacity: 1;
}
`
const Button = styled.button`
  animation: 200ms ${fadeIn};
  animation-fill-mode: both;
`
```
This button will fade in over 200ms when it is first rendered. The `animation-fill-mode` tells it to use the "from" opacity before the animation and keep the "to" opacity afterwards.

We can also make a continuous animation.
```js
const pulse = keyframes`
0% {
  transform: scale(1);
}
50% {
  transform: scale(1.2);
}
100% {
  transform: scale(1);
}
`
const PulsingButton = styled.button`
  animation: 200ms ${pulse} infinite;
`
```
Here you can also see that we can start to script more elaborate animations, and we could animate multiple properties at the same time, such as making it scale and rotate. But each element's animations are going to run independently of each other, so we would have to do some elaborate scheduling to sequence animations between multiple elements.

In both of these cases, the animations are achieved with a single React render. Again, no JavaScript execution per frame of animation, so the browser can optimise it well.

Good for:
* High performance
* Entrance animations
* Continuous animations
* More sequencing

Less good for:
* Exit animations
* Coordinating animations between elements
* Realistic motion (ish)

### React Transition Group
Both of these CSS techniques depend on the elements being animated being present in the DOM at both the start and finish of the animations. For state changes and entrances, that's fine, but when elements are being removed, React will remove the element from the DOM straight away, not waiting around to see if we want to animate its departure.

React transition group is a component that can help us with this, while continuing to use high performance CSS animations. For exits, it renders your component first with an `exit` class, then `exit-active` and finally `exit-done` (or optionally to actually unmount your component and remove it from the DOM). It forces a re-render between each class change, to allow your animation to be applied using the `transition` property.

```jsx
const Button = styled.button`
  transition: all 200ms;
  &.fade-enter {
    opacity: 0;
    transform: scale(0.8);
  }
  &.fade-enter-active {
    opacity: 1;
    transform: scale(1);
  }
  &.fade-exit {
    opacity: 1;
    transform: scale(1);
  }
  &.fade-exit-active {
    opacity: 0;
    transform: scale(0.8);
  }
`
const FadeInOutButton = ({ show }) => {
  return (
    <CSSTransition
      in={show}
      unmountOnExit
      classNames="fade"
      timeout={200}
      >
      <Button>Click Me!</Button>
    </CSSTransition>
  )
}
```
When `show` becomes true, the button is immediately added to the DOM, but with the `fade-enter` class so it is not visible. The `CSSTransition` component immediately replaces the `fade-enter` class with `fade-enter-active`, triggering the opacity and scale transitions. When `show` becomes false, it does the reverse (`fade-exit` then `fade-exit-active`), before unmounting the button (because `unmountOnExit` is set). The animation duration must be coordinated between the CSS transition duration and the `timeout` prop.

Good for:
* Animating in and out

Less good for:
* Interruptible transitions
* Coordinating animations between elements
* Realistic motion

Pure CSS animations are great for high performance, and relatively simple transitions. But there have been a few gaps in what we can achieve with them:
* Interruptible animations
* Animations coordinated between elements
* Realistic motion (ish)
* Animations driven by numeric/continuous values, rather than discrete values.

For these, we'll need to break out into JavaScript-land, which we'll do in part 2!
