document.getElementById('sendMessageButton').addEventListener('click', async () => {
    const message = document.getElementById('messageInput').value;
    
    if (message) {
        const response = await fetch('http://127.0.0.1:8000/process_message/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message }),
        });

        const data = await response.json();
        document.getElementById('serverResponse').textContent = data.response;
    } else {
        alert('Please enter a message.');
    }
});
