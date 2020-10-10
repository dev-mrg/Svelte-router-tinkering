<script>
import jQuery from 'jquery';
  import Home from "./Home.svelte";
  import Learn from "./Learn.svelte";
  import Blog from "./Blog.svelte";
  import Login from "./auth/Login";
  import Register from "./auth/Register";
  import { user } from "./utils/store.js";
  import Router, { location } from "svelte-spa-router";
const j$ = jQuery;

  const handleLogOut = () => {
    auth.signOut().then(
      function() {
        // Sign-out successful.
        user.set({ ...$user, loggedIn: false });
        console.log("logout", $user);
      },
      function(error) {
        // An error happened.
        console.warn("error on logout", error.message);
      }
    );
  };

  function getProps({ location, href, isPartiallyCurrent, isCurrent }) {
    const isActive =
      href === "/../auth" ? isCurrent : isPartiallyCurrent || isCurrent;
    authpage();
  }


  const routes = {
    "/home": Home,
    "/learn/:headline?headline": Learn,
    "/blog": Blog,
       "/login": Login,
    "/register": Register
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
    <a id="log" class="a" href="#/login">Login</a>
  <a id="reg" class="a" href="#/register">Register</a>
  <a class="a" href="#/learn" on:click={loc}>Learn More</a>
  <a class="a" href="#/blog" on:click={loc}>Blog</a>

</nav>
<h1 id="h1">
Welcome Svelte Is Awesome
</h1>


