<script>
import Router,{ push,pop} from "svelte-spa-router";
import jQuery from 'jquery';

  const j$ = jQuery;
  function navThisWay() {
    push("/blog");
  }
  function navThatWay(){
    push("/learn")
  }
  function goBack(){
     pop()
  }
  function landing(){
    push("/")
    j$('#h1').show();
  }

</script>
<div class="app">
<h1>Home</h1>
<div class='btn-container'>
<button class="btn" on:click={navThisWay}>Try This Nav</button>
<button class="btn" on:click={navThatWay}>Try This Nav</button>
<button class="btn" on:click={goBack}>Go Back</button>
<button class="btn" on:click={landing}>Landing</button>
</div>
</div>