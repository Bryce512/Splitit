document.addEventListener('DOMContentLoaded', function() {
  overlay = document.getElementById('overlay');

  // Function to open the modal
  const openModal = function(id, split_name) {
    const modal = document.getElementById('editModal');
    const overlay = document.getElementById('overlay'); // Assuming you have an overlay element

    // Make modal visible
    modal.classList.remove('hidden');
    modal.classList.add('visible');
    overlay.classList.add('visible');

    // Set dynamic modal content based on the row's ID
    const titleElement = document.getElementById('modalTitle');
    titleElement.textContent = "Pay " + split_name;  // Update the title (customize as needed)

    // Optionally, populate form fields based on the ID
    document.getElementById('status').value = `user${id}`; // Sample dynamic data (adjust as needed)
    overlay.addEventListener('click', closeModal);

  };

  // Function to close the modal
  const closeModal = function() {
    const modal = document.getElementById('editModal');
    const overlay = document.getElementById('overlay');

    // Hide the modal and overlay
    modal.classList.remove('visible');
    overlay.classList.remove('visible');
  };

  // Use event delegation to handle row clicks
  const editModal = () => {
    const container = document.getElementById('payment_container'); // Parent element of all rows, e.g., <ul> or <table>
    const form = document.getElementById('paymentForm');

    container.addEventListener('click', function(e) {
      const row = e.target.closest('.editable-row'); // Find the closest editable-row element that was clicked
      const type = row.getAttribute('type');
      const split_name = row.getAttribute('split_name');
      const amount_due = row.getAttribute('amount_Due');


      if (type === 'payment') {
  
        document.getElementById('modal_Amount_Due').innerText = amount_due;
      }

      // Ensure the row is valid and has the 'payment-id' attribute
      if (row && row.hasAttribute('payment-id')) {
        const id = row.getAttribute('payment-id'); // Get the 'payment-id' from the clicked row
        // Set the form action with the dynamic id
        form.action = `/makePayment/${id}`;
        if (id) {
          openModal(id,split_name); // Open the modal and pass the ID to update the modal's content
        } else {
          console.log("Row does not have payment-id attribute");
        }
      }
    });

    // Close modal on Cancel button click
    const closeModalBtn = document.querySelector('.adminModalClose');
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', function(e) {
        e.preventDefault(); // Prevent form submission if needed
        closeModal();
      });
    }
  }

  // Call editModal function to attach events on page load
  editModal();

  // Initialize modal
  const modals = document.querySelectorAll('.modal');
  M.Modal.init(modals);

  // Initialize edit date picker
  const editDatepicker = document.getElementById('edit_date_due');
  M.Datepicker.init(editDatepicker, {
    format: 'yyyy-mm-dd',
    autoClose: true,
    showClearBtn: true,
    showDoneBtn: true
  });

  // Handle edit recurring switch
  const editRecurringSwitch = document.getElementById('edit_recurring');
  const editFrequencyField = document.getElementById('edit_frequencyField');

  editRecurringSwitch.addEventListener('change', function() {
    if (this.checked) {
      editFrequencyField.style.display = 'block';
      document.getElementById('edit_frequency').required = true;
    } else {
      editFrequencyField.style.display = 'none';
      document.getElementById('edit_frequency').required = false;
      document.getElementById('edit_frequency').value = '';
      M.FormSelect.init(document.getElementById('edit_frequency'));
    }
  });
});





document.querySelectorAll('.editable-row').forEach(row => {
  row.addEventListener('mouseenter', () => {
    row.classList.add('hover');
  });
  row.addEventListener('mouseleave', () => {
    row.classList.remove('hover');
  });
});

function deleteProfile(userId) {
  if (confirm('Are you sure you want to delete your profile? This action cannot be undone.')) {
    fetch(`/deleteProfile/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.redirect) {
        window.location.href = data.redirect;
      } else {
        alert(data.message);
        // Optionally refresh the page or update the UI
        window.location.reload();
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Failed to delete profile. Please try again.');
    });
  }
}

function deleteHouse(houseId) {
  if (confirm('Are you sure you want to delete this house? This will delete all associated splits and payments.')) {
    fetch(`/deleteHouse/${houseId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      alert(data.message);
      window.location.reload();
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Failed to delete house. Please try again.');
    });
  }
}

function deleteSplit(splitId) {
  if (confirm('Are you sure you want to delete this split? This will delete all associated payments.')) {
    fetch(`/deleteSplit/${splitId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      alert(data.message);
      window.location.reload();
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Failed to delete split. Please try again.');
    });
  }
}

function deletePayment(paymentId) {
  if (confirm('Are you sure you want to delete this payment?')) {
    fetch(`/deletePayment/${paymentId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      alert(data.message);
      window.location.reload();
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Failed to delete payment. Please try again.');
    });
  }
}

function leaveHouse(houseId) {
  if (confirm('Are you sure you want to leave this house? This will remove all your associated payments.')) {
    fetch(`/leaveHouse/${houseId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      alert(data.message);
      window.location.reload();
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Failed to leave house. Please try again.');
    });
  }
}

let currentEditingSplitId = null;

function editSplit(splitId) {
  currentEditingSplitId = splitId;
  
  // Fetch split details
  fetch(`/getSplit/${splitId}`)
    .then(response => response.json())
    .then(split => {
      // Populate form fields
      document.getElementById('edit_split_name').value = split.split_name;
      document.getElementById('edit_total_amount').value = split.total_amount;
      
      // Set date
      const datepicker = M.Datepicker.getInstance(document.getElementById('edit_date_due'));
      datepicker.setDate(new Date(split.date_due));
      
      // Set recurring checkbox and frequency
      const recurringCheckbox = document.getElementById('edit_recurring');
      recurringCheckbox.checked = split.recurring;
      
      if (split.recurring) {
        document.getElementById('edit_frequencyField').style.display = 'block';
        document.getElementById('edit_frequency').value = split.frequency;
        M.FormSelect.init(document.getElementById('edit_frequency'));
      }
      
      // Activate labels
      M.updateTextFields();
      
      // Open modal
      const modal = document.getElementById('editSplitModal');
      M.Modal.getInstance(modal).open();
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Failed to fetch split details');
    });
}

function updateSplit() {
  if (!currentEditingSplitId) return;

  const formData = {
    split_name: document.getElementById('edit_split_name').value,
    total_amount: document.getElementById('edit_total_amount').value,
    date_due: document.getElementById('edit_date_due').value,
    recurring: document.getElementById('edit_recurring').checked,
    frequency: document.getElementById('edit_recurring').checked ? 
      document.getElementById('edit_frequency').value : null
  };

  fetch(`/updateSplit/${currentEditingSplitId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formData)
  })
  .then(response => response.json())
  .then(data => {
    if (data.error) {
      throw new Error(data.error);
    }
    M.Modal.getInstance(document.getElementById('editSplitModal')).close();
    window.location.reload();
  })
  .catch(error => {
    console.error('Error:', error);
    alert('Failed to update split');
  });
}
