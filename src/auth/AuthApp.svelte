<script>
    import Register from './Register.svelte';
    import Dashboard from './../App.svelte';
import {authpage} from '../componets/function.js';
    import { Router, Link, Route } from 'svelte-routing';
    import Login from './Login.svelte';
    import { user } from './../util/store.js';
    import { auth } from './../utils/firebase.js';

    const classActive = "active";
    const classInactive = "inactive";

    const handleLogOut = () => { 
        auth.signOut().then(function() {
            // Sign-out successful.
            user.set({...$user, loggedIn: false});
            console.log('logout', $user);

        }, function(error) {
            // An error happened.
            console.warn('error on logout', error.message);
        });
    }

    function getProps({ location, href, isPartiallyCurrent, isCurrent }) {
        const isActive = href === "/../auth" ? isCurrent : isPartiallyCurrent || isCurrent
            authpage();
    }
    // (()=>{user.loggedIn}) ? document.getElementById("router").style.display = "none":document.getElementById("router").style.display = "flex";

</script>



<Router >
    <ul id="Router">
        <li class="lli" ><Link to="/" getProps="{getProps}">Home</Link></li>
        {#if $user.loggedIn}
            <li class="lli" on:click={authpage}><Link to="app" getProps="{getProps}">Dashboard</Link></li>
            <li class="lli"><a class="active" href="./../auth/" on:click={handleLogOut}>Logout</a></li>
        {:else}
            <li class="lli"><Link to="login" getProps="{getProps}">Login</Link></li>
            <li class="lli"><Link to="register" getProps="{getProps}">Register</Link></li>
        {/if}
    </ul>

    <Route path="login" component={Login} />
    <Route path="register" component={Register} />
    <Route path="dashboard" component={Dashboard} />
    <Route path="/">

    </Route>
</Router>
