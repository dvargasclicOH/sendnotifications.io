import React, { useState } from 'react';
import './App.css'

function App() {
  const [csvData, setCsvData] = useState(null);
  const [category, setCategory] = useState('');
  const [template, setTemplate] = useState('');
  const [message, setMessage] = useState('');

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) {
      alert("Por favor, selecciona un archivo CSV.");
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      const csv = e.target.result;
      const rows = csv.split('\n').map(row => row.split(','));

      // Convertir las filas en objetos con claves
      const headers = rows[0]; // Primera fila como encabezados
      const data = rows.slice(1).map(row => {
        let obj = {};
        headers.forEach((header, index) => {
          obj[header.trim()] = row[index] ? row[index].trim() : '';
        });
        return obj;
      });

      setCsvData(data);
    };

    reader.readAsText(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!csvData) {
      alert("Por favor, selecciona un archivo CSV.");
      return;
    }

    try {
      for (const row of csvData) {
        await sendWebhook(category, template, row);
      }
      setMessage('¡Envíos completados!');
    } catch (error) {
      console.error("Error enviando los webhooks", error);
      setMessage('Hubo un error al enviar los webhooks.');
    }
  };

  const sendWebhook = async (category, template, rowData) => {
    const webhookUrl = process.env.REACT_APP_WEBHOOK_URL;
    const bearerToken = process.env.REACT_APP_BEARER_TOKEN;
    console.log("Webhook URL:", process.env.REACT_APP_WEBHOOK_URL);
    console.log("Bearer Token:", process.env.REACT_APP_BEARER_TOKEN);

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${bearerToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          category: category,
          template: template,
          data: rowData
        }),
      });

      if (!response.ok) {
        const errorText = await response.text(); // Lee el mensaje de error
        throw new Error(`Error en el envío del webhook: ${errorText}`);
      }

      const result = await response.json();
      console.log("Respuesta del webhook:", result);
      return result;
    } catch (error) {
      console.error("Error enviando webhook:", error.message); // Mensaje más claro
      throw error;
    }
  };

  return (
    <div className="App">
      <h1>Enviar Masivo</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Categoría: </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Template: </label>
          <input
            type="text"
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Subir archivo CSV: </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            required
          />
        </div>
        <button type="submit">Enviar Webhook</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default App;
