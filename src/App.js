import React, { useState } from 'react';
import './App.css';

function App() {
  const [csvData, setCsvData] = useState(null);
  const [category, setCategory] = useState('');
  const [template, setTemplate] = useState('');
  const [message, setMessage] = useState('');
  const [fileMessage, setFileMessage] = useState('Ningún archivo seleccionado'); // Estado para el mensaje del archivo

  //Cargar categorías y templates
  const categoryOptions = ['Devoluciones','Guías_producidas','Indemnizaciones','Novedad_recolección'];
  const templateOptByCtg = {
    'Devoluciones': ['Primer contacto por novedad en devolución','10 días después del primer envio','15 días, luego del primer contacto'],
    'Guías_producidas': ['No otorga trazabilidad','10 días después del primer envio'],
    'Indemnizaciones': ['Primer contacto, por novedad 106','10 días, luego del primer contacto','15 días, cierre indemnización'],
    'Novedad_recolección': ['Cliente despacha con otra transportadora','Validación causal no despacho','Mercancía no lista / Mal empacada','Dirección errada','Cierre caso',]
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) {
      setFileMessage("Ningún archivo seleccionado"); // Actualiza el mensaje si no hay archivo
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
      setFileMessage(file.name); // Actualiza el mensaje con el nombre del archivo
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

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setTemplate('');
  }

  const templateForSelectedCategory = templateOptByCtg[category] || [];

  return (
    <div className="App">
      <h1>Enviar Masivo</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Categoría: </label>
          <select
            value={category}
            onChange={handleCategoryChange}
            required
          >
            <option value="">Selecciona una categoría</option>
            {categoryOptions.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
            </select>
        </div>
        <div>
          <label>Template: </label>
          <select            
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            required
            disabled={!category}
          >
            <option value="">Selecciona un template</option>
            {templateForSelectedCategory.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
            </select>
        </div>
        <div class="containter-csv">
          <label class="upload-label">Subir archivo CSV:</label>
          <div class="file-upload-container">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="file-csv"
              required
            />
            <p className="file-message">{fileMessage}</p> {/* Mensaje actualizado */}
          </div>
        </div>
        <button type="submit">Enviar masivo</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default App;