<script>
  import User from "./../forms/User.svelte";

  let users = JSON.parse(localStorage.getItem("users")) || [];
  let newUser = {
    id: users.length <= 0 ? 0 : users[users.length - 1].id + 1,
    email: "",
    firstname: "",
    lastname: "", 
    age: 0
  };
// console.log(firebaseUser)
  function addUser(detail) {

    users = [...users, detail];
    newUser = {
      id: newUser.id + 1,
      email: "",
      firstname: "",
      lastname: "",
      age: 0
    };
    updateLocalStorage();
  }

  // function editUser(detail) {
  //   let i = users.findIndex(s => s.id === detail.id);
  //   users[i] = detail;
  //   updateLocalStorage();
  // }

  function updateLocalStorage() {
    localStorage.setItem("users", JSON.stringify(users));
  }
</script>

<style>
  /* :global(body) {
    text-align: center;
  } */


</style>


<div class="wrapper">
<h1>Users</h1>
  <table width="100%">
    <tr>
      <th>id</th>
      <th>Email</th>
      <th>Firstname</th>
      <th>Lastname</th>
      <th>Age</th>
      <th>Age</th>
    </tr>
    {#each users as user}
      <!-- <User {...user} on:edit={ e => editUser(e.detail) }/> -->
    {/each}
    <User {...newUser} addUser on:edit={ e => addUser(e.detail) }/>
  </table>
</div>


