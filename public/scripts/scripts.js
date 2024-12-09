
document.addEventListener('DOMContentLoaded', function() {

// Attach row click events dynamically (This is the important part)
const editModal = () => {
  let title = '';
  const openModalBtns = document.querySelectorAll('.editable-row');
  const titleElement = document.getElementById('modalTitle');  // Make sure the ID matches


  openModalBtns.forEach(row => {
    row.addEventListener('click', function () {

  })

  });
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