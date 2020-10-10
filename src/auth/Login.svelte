<script>
    import { auth, provider } from './../forms/package/shared/firebase.js';
     import Router,{push, pop, replace} from 'svelte-spa-router';
    import { user } from './../utils/store.js';
    import Dashboard from './../pages/Dashboard.svelte';


    let email = '';
    let password = ''; v

const route= {
    "/dashboard": Dashboard
}
    const handleGoogleLogin = () => {
        auth.signInWithPopup(provider).then(function(result) {
            // This gives you a Google Access Token. You can use it to access the Google API.
            var token = result.credential.accessToken;
            // The signed-in user info.
            var firebaseuser = result.user;

            if(firebaseuser) {
                let {email} = firebaseuser;
                console.log('Google first', $user);
                user.set({...$user, loggedIn: true, email});
                console.log('Google then', $user);
   
            }
            // ...
        }).catch(function(error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            // The email of the user's account used.
            var email = error.email;
            // The firebase.auth.AuthCredential type that was used.
            var credential = error.credential;
            // ...
        });
    };

    // Destructuring to obtain email and password from form via Event
    const handleLoginForm = () => {
        auth.signInWithEmailAndPassword(email, password).then(function(result) {

            let firebaseUser = auth.currentUser;

            if(firebaseUser) {
                let {email} = firebaseUser;
                console.log('first', $user);
                user.set({...$user, loggedIn: true, email});
                console.log('then', $user);
    
            }

        }).catch(error => alert(error.message));
        
    };


</script>



<div class="container">
    <div>
        <label for="email">Email</label>
        <input type="email" name="email" bind:value={email}>
    </div>
    <div>
        <label for="password">Password</label>
        <input type="password" name="password" bind:value={password}>
    </div>
    <div id="lower">
        <button class="login" on:click={handleLoginForm}>Login</button>
        <button class="googlelogin" on:click={handleGoogleLogin}>Google</button>

    </div>

</div>


	<Router {route}/>