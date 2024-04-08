document.addEventListener('DOMContentLoaded', function () {
    const checkboxElement = document.getElementById('checkbox');
    if (checkboxElement) {
        checkboxElement.addEventListener('change', function (event) {
            if (this.checked) {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
        });
        if (!document.body.classList.contains('dark-mode')) {
            console.log('Dark mode is initially off');
        }
    } else {
        console.error('Checkbox element not found');
    }
});