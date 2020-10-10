<script>
    import { auth, provider } from './../forms/package/shared/firebase.js';
    import { user } from './../utils/store.js';
    import Router,{push, pop, replace} from 'svelte-spa-router';
    import Parttwo from './PartTwoReg.svelte';


const route= { 
    "/parttwo": Parttwo
}
    const handleGoogleLogin = () => {
        auth.signInWithPopup(provider).then(function(result) {
            // This gives you a Google Access Token. You can use it to access the Google API.
            var token = result.credential.accessToken;
            // The signed-in user info.
            var firebaseuser = result.user;

            if(firebaseuser) {
                let {email} = firebaseuser;
                console.log('first', $user);
                user.set({...$user, loggedIn: true, email});
                console.log('then', $user);
                     push('/parttwo');

            }
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
    const handleRegisterForm = ({ 
        target: { elements: { email, password } } 
    }) => {
        auth.createUserWithEmailAndPassword(email.value, password.value).catch(error => alert(error.message));
        let firebaseUser = auth.currentUser;

        if(firebaseUser) {
            let {email} = firebaseUser;
            console.log('first', $user);
            user.set({...$user, loggedIn: true, email});
            console.log('then', $user);
            setTimeout(() => push('/parttwo'), 1200)
          
        }
    };

</script>


<div class="container">
  <!-- <form on:submit={()=> submit()}> -->
       <form on:submit|preventDefault={handleRegisterForm}>
        <div>
            <label for="email">Email</label>
            <input type="email" name="email" id="email">
        </div>
        <div>
            <label for="password">Password</label>
            <input type="password" name="password" id="password">
        </div>
        <div id="lower">
         <!-- <button class="login" on:click={go}>P2</button> -->
      <button class="login" type="submit" value="Register" >Register</button>
            <button class="googlelogin" on:click={handleGoogleLogin}>Google</button>
        </div>
    </form>
</div>

	<Router {route}/> 

<!-- 

   import { auth, provider } from './../utils/firebase.js';
    import Router,{push, pop, replace} from 'svelte-spa-router';
    import { navigate } from 'svelte-routing';
import { user } from './../utils/store.js';
 import Parttwo from './PartTwoReg.svelte';


    const handleGoogleLogin = () => {
        auth.signInWithPopup(provider).then(function(result) {
            // This gives you a Google Access Token. You can use it to access the Google API.
            var token = result.credential.accessToken;
            // The signed-in user info.
            var firebaseuser = result.user;

            if(firebaseuser) {
                let {email} = firebaseuser;
                console.log('first', $user);
                user.set({...$user, loggedIn: true, email});
                console.log('then', $user);
                     push('/parttwo');

            }
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
    const handleRegisterForm = ({
                                    target: { elements: { email, password } }
                                }) =>{
        auth.createUserWithEmailAndPassword(email.value, password.value).catch(error => alert(error.message));
        let firebaseUser = auth.currentUser;

        if(firebaseUser) {
            let {email} = firebaseUser;
            user.set({...$user, loggedIn: true, email});  
        }

      setTimeout(function(){
 push('/parttwo')
      },1200)
      }
</script>


<div id="container">
    <form on:submit|preventDefault={handleRegisterForm}>
        <div>
            <label for="email">Email</label>
            <input type="email" name="email" id="email">
        </div>
        <div>
            <label for="password">Password</label>
            <input type="password" name="password" id="password">
        </div>
        <div id="lower">
            <input type="submit" value="Register">
             <button class="googlelogin" on:click={handleGoogleLogin}>Google</button>
        </div>
    </form>
</div>


<Router {route}/> -->