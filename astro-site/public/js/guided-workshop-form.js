function initForm() {
  var form = document.getElementById('workshop-form');
  var startingFreshRadios = document.querySelectorAll('input[name="startingFresh"]');
  var submitButton = document.querySelector('button[type="submit"]');
  var warningMessage = document.getElementById('start-fresh-warning');

  if (!form || !submitButton) {
    return;
  }

  function updateFormState() {
    var selected = document.querySelector('input[name="startingFresh"]:checked');

    if (selected && selected.value === 'no') {
      submitButton.disabled = true;
      submitButton.textContent = 'Workshops require a fresh start';
      if (warningMessage) warningMessage.hidden = false;
    } else {
      submitButton.disabled = false;
      submitButton.textContent = 'Submit Application';
      if (warningMessage) warningMessage.hidden = true;
    }
  }

  startingFreshRadios.forEach(function(radio) {
    radio.addEventListener('change', updateFormState);
  });

  updateFormState();

  submitButton.addEventListener('click', function(event) {
    event.preventDefault();
    
    if (!form.checkValidity()) {
      alert('Form has invalid fields');
      form.reportValidity();
      return;
    }
    
    var honeypot = form.querySelector('input[name="company"]');
    if (honeypot && honeypot.value.trim() !== '') {
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';
    alert('Sending to server...');

    var formData = new FormData(form);
    var data = {};
    formData.forEach(function(value, key) {
      data[key] = value;
    });

    fetch('/.netlify/functions/guided-workshop-submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(function(response) {
      if (response.ok) {
        window.location.href = '/guided-workshop/thanks';
      } else {
        return response.text().then(function(text) {
          console.error('Status:', response.status);
          console.error('Response:', text);
          alert('Something went wrong. Please try again.');
          submitButton.disabled = false;
          submitButton.textContent = 'Submit Application';
        });
      }
    })
    .catch(function(error) {
      console.error('Network error:', error);
      alert('Connection error. Please check your internet and try again.');
      submitButton.disabled = false;
      submitButton.textContent = 'Submit Application';
    });
  });

  var patternRadios = document.querySelectorAll('input[name="patternStatus"]');
  var patternField = document.getElementById('pattern-name-field');

  if (patternRadios.length && patternField) {
    function updatePatternField() {
      var selected = document.querySelector('input[name="patternStatus"]:checked');
      if (!selected) return;

      if (selected.value === 'haveOne' || selected.value === 'fewOptions') {
        patternField.hidden = false;
      } else {
        patternField.hidden = true;
      }
    }

    patternRadios.forEach(function(radio) {
      radio.addEventListener('change', updatePatternField);
    });

    updatePatternField();
  }
}

// Run immediately if DOM ready, otherwise wait for it
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initForm);
} else {
  initForm();
}
