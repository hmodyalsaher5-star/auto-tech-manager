

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

/*
import React from 'react'
import ReactDOM from 'react-dom/client'
// import App from './App.jsx'  <-- قم بتعليق هذا السطر
import DeliveryMain from './components/DeliverySystem/DeliveryMain.jsx' // <-- استدعِ ملفنا الجديد
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DeliveryMain /> 
  </React.StrictMode>,
) 
*/