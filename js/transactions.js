document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const fileInput = document.getElementById('fileInput');
    if (fileInput.files.length === 0) {
        document.getElementById('response').textContent = 'Please select a file.';
        return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('http://localhost:8090/api/uploads/upload', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            document.getElementById('response').textContent = 'File uploaded successfully.';
        } else {
            document.getElementById('response').textContent = 'File upload failed.';
        }
    } catch (error) {
        console.error('Error uploading file:', error);
        document.getElementById('response').textContent = 'Error uploading file.';
    }
});