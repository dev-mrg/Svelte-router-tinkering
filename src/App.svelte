<script>
import jQuery from 'jquery';
  import Home from "./Home.svelte";
  import Learn from "./Learn.svelte";
  import Blog from "./Blog.svelte";
  import Router, { location } from "svelte-spa-router";
const j$ = jQuery;
  const routes = {
    "/home": Home,
    "/learn/:headline?headline": Learn,
    "/blog": Blog
  };
loc();

export function loc() {
   console.log('envoked')
   if(window.location != "http://localhost:5000/#"){
     j$('#h1').hide();
   }
 }
</script>
<style>

</style>

  <Router {routes} />

<nav class="navigation">
  <a class="a" href="#/home" on:click={loc}>Home</a>
  
  <a class="a" href="#/learn" on:click={loc}>Learn More</a>
  <a class="a" href="#/blog" on:click={loc}>Blog</a>
</nav>
<h1 id="h1">
Welcome Svelte Is Awesome
</h1>


