<script>
  import Router, { pop,location } from "svelte-spa-router";
  import {pages} from "./store.js";
  function goBack() {
    pop();
  }

const p = pages.storie;
const p2 = pages.storie2;
const p3 = pages.storie3;
const p4 = pages.storie4;

  export let params;
</script>
<style>
p{
  padding:10px;
  color:rgba(225,225,225,1);
}
.learn{
  width:80vw;
  display:flex;
  background:rgba(115, 115, 255, 0.2);
  min-height:100%;
  padding:5% 10% 10% 10%;
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
  z-index: 5;

}

#switch{
  background-size: contain;
  overflow:auto;
  width:50vw;
  height:50vh;
  padding:20px;
  background:rgba(55,55,55,1);
}

p{
   overflow:auto;
}

.btns{
  width:100px;
  height:50px;
  font-size:14px;

  text-align: center;
  text-decoration: none;
  background:rgba(115, 115, 255, 0.2);
   transition:all .35s ease-in-out;
}
.btns:hover{
  transition:all .35s ease-in-out;
  background:rgba(115, 115, 255, 0.8);
  color:white;
}
</style>

<div class="learn">

<h1>Find Out More</h1>
<div id="switch">
<h1>These are really neat!</h1>
<p>  -- {
  params.headline === 'p' ? params.headline= p 
: params.headline === 'p2' ? params.headline= p2 
: params.headline === 'p3' ? params.headline = p3 
: params.headline = p4  
} 
</p>
</div>
<div class='btn-container'>
<a class="btns" href="#/learn/p">Learn 1</a>
 <a class="btns" href="#/learn/p2">Learn 2</a>
 <a class="btns" href="#/learn/p3">Learn 3</a>
  <a class="btns" href="#/learn/p4">Learn 4</a>
<button on:click={goBack}>Go Back</button>
</div>
</div>
