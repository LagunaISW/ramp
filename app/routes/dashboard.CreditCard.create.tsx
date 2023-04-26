import React, { useState } from "react";

export default function CreateCreditCard() {
return (
<div>
  <h2>Create a new CreditCard</h2>
  <form>
    <div>
      <label htmlFor="id">Id:</label>
      <input type="text" id="id" name="id" value={ '' } />
    </div>
    <div>
      <label htmlFor="number">Number:</label>
      <input type="text" id="number" name="number" value={ '' } />
    </div>
    <div>
      <label htmlFor="provider">Provider:</label>
      <input type="text" id="provider" name="provider" value={ '' } />
    </div>
    <div>
      <label htmlFor="cvv">Cvv:</label>
      <input type="text" id="cvv" name="cvv" value={ '' } />
    </div>
    <div>
      <label htmlFor="pin">Pin:</label>
      <input type="text" id="pin" name="pin" value={ '' } />
    </div>
    <div>
      <label htmlFor="expirationDate">ExpirationDate:</label>
      <input type="datetime-local" id="expirationDate" name="expirationDate" value={ null } />
    </div>
    <div>
      <label htmlFor="Client">Client:</label>
      <input type="text" id="Client" name="Client" value={ null } />
    </div>
    <button type="submit">Create CreditCard</button>
  </form>
</div>
);
}