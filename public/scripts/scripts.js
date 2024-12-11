
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
});





document.querySelectorAll('.editable-row').forEach(row => {
  row.addEventListener('mouseenter', () => {
    row.classList.add('hover');
  });
  row.addEventListener('mouseleave', () => {
    row.classList.remove('hover');
  });
});
