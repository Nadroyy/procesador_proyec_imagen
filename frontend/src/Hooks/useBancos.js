import { useState, useEffect } from 'react';

// Simulación de cuentas (en producción esto vendría de una API)
const cuentasReales = [
  {
    id: 'BCO_4760',
    tipo: 'banco',
    nombreBanco: 'Bancolombia',
    ultimos4: '4760',
    nombreMostrar: 'Bancolombia (4760)',
    numeroCompleto: '82000004760',
  },
  {
    id: 'BCO_9666',
    tipo: 'banco',
    nombreBanco: 'Bancolombia',
    ultimos4: '9666',
    nombreMostrar: 'Bancolombia (9666)',
    numeroCompleto: '49700009666',
  },
  {
    id: 'DAV_1137',
    tipo: 'banco',
    nombreBanco: 'Davivienda',
    ultimos4: '1137',
    nombreMostrar: 'Davivienda (1137)',
    numeroCompleto: '108969951137',
  },
  {
    id: 'BREB_3250',
    tipo: 'pasarela',
    nombreBanco: 'Bre-B',
    ultimos4: '3250',               // Últimos 4 del código de negocio
    nombreMostrar: 'Bre-B (3250)',
    numeroCompleto: '0087783250',
  },
  {
    id: 'NEQUI_0000',                // Si manejas Nequi sin número fijo
    tipo: 'wallet',
    nombreBanco: 'Nequi',
    ultimos4: null,                  // No aplica, se seleccionaría por nombre
    nombreMostrar: 'Nequi',
  },
  // Agrega aquí todas las cuentas que manejes
];

export const useBancos = () => {
  const [bancos, setBancos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simular carga (en producción: fetch('/api/cuentas'))
    setCargando(true);
    setTimeout(() => {
      setBancos(cuentasReales);
      setCargando(false);
    }, 300);
  }, []);

  return { bancos, cargando, error };
};