
document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('modal');
  const overlay = document.getElementById('overlay');
  const closeModalBtn = document.querySelector('.modal-close');


  // Attach row click events dynamically (This is the important part)
  const editModal = () => {
    let title = '';
    const openModalBtns = document.querySelectorAll('.editable-row');
    const titleElement = document.getElementById('modalTitle');  // Make sure the ID matches


    openModalBtns.forEach(row => {
      row.addEventListener('click', function () {
        const id = row.getAttribute('pmt-id');
      })

    openModal(id);

  });

  editModal()
}

// Open modal function
const openModal = function (id) {
  modal.classList.add('visible');
  overlay.classList.add('visible');
};

const closeModal = function () {
  modal.classList.remove('visible');
  modal1.classList.remove('visible');
  overlay.classList.remove('visible');
  deleteButton.style.display = 'none'; // Hide the delete button when closing modal
}


document.querySelectorAll('.editable-row').forEach(row => {
  row.addEventListener('mouseenter', () => {
    row.classList.add('hover');
  });
  row.addEventListener('mouseleave', () => {
    row.classList.remove('hover');
  });
});

});