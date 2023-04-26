export default function CreateAnalyst() {
return (
<div>
  <h2>Create a new Analyst</h2>
  <form>
    <div>
      <label htmlFor="id">Id:</label>
      <input type="text" id="id" name="id" value={ '' } />
    </div>
    <div>
      <label htmlFor="name">Name:</label>
      <input type="text" id="name" name="name" value={ '' } />
    </div>
    <div>
      <label htmlFor="email">Email:</label>
      <input type="text" id="email" name="email" value={ '' } />
    </div>
    <div>
      <label htmlFor="Client">Client:</label>
      <input type="text" id="Client" name="Client" value={ null } />
    </div>
    <button type="submit">Create Analyst</button>
  </form>
</div>
);
}