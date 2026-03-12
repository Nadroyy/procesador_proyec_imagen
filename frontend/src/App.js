import React, { useState } from 'react';
import { Container, CssBaseline, Button, Box } from '@mui/material';
import FormularioMetodoPago from './components/FormularioMetodoPago';

function App() {
  const [modoPago, setModoPago] = useState('transfer');
  const [montoRecibido, setMontoRecibido] = useState('');
  const [fechaActual, setFechaActual] = useState('');
  const [cuentaBancaria, setCuentaBancaria] = useState('');
  const [bancoSeleccionado, setBancoSeleccionado] = useState('');
  const [ultimosDigitos, setUltimosDigitos] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [resetTrigger, setResetTrigger] = useState(0);
  const [resetCompletado, setResetCompletado] = useState(false);

  const handleMontoChange = (e) => setMontoRecibido(e.target.value);
  const handleFechaChange = (fecha) => setFechaActual(fecha);
  const handleCuentaChange = (cuenta) => setCuentaBancaria(cuenta);
  const handleBancoChange = (banco) => setBancoSeleccionado(banco);
  const handleDigitosChange = (e) => setUltimosDigitos(e.target.value);
  const handleTelefonoChange = (tel) => setTelefonoCliente(tel);
  const handleVoucherChange = (voucher) => console.log('Voucher:', voucher);
  const handleSinVoucherChange = (sin) => console.log('Sin voucher:', sin);
  const handleUsuarioSeleccionado = (usuario) => console.log('Usuario:', usuario);
  const handleValidacionCambio = (valido) => console.log('Válido:', valido);
  const handleBusquedaIniciada = () => console.log('Búsqueda iniciada');

  return (
    <>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <FormularioMetodoPago
          modoPago={modoPago}
          onModoPagoChange={setModoPago}
          montoRecibido={montoRecibido}
          onMontoChange={handleMontoChange}
          fechaActual={fechaActual}
          onFechaChange={handleFechaChange}
          cuentaBancaria={cuentaBancaria}
          onCuentaBancariaChange={handleCuentaChange}
          bancoSeleccionado={bancoSeleccionado}
          onBancoChange={handleBancoChange}
          ultimosDigitos={ultimosDigitos}
          onDigitosChange={handleDigitosChange}
          onVoucherChange={handleVoucherChange}
          onSinVoucherChange={handleSinVoucherChange}
          onUsuarioSeleccionado={handleUsuarioSeleccionado}
          onValidacionCambio={handleValidacionCambio}
          onBusquedaIniciada={handleBusquedaIniciada}
          telefonoCliente={telefonoCliente}
          onTelefonoChange={handleTelefonoChange}
          resetTrigger={resetTrigger}
          onResetCompletado={() => setResetCompletado(true)}
          debugMode={true}
        />
        <Box sx={{ mt: 2 }}>
          <Button 
            variant="contained" 
            onClick={() => setResetTrigger(prev => prev + 1)}
          >
            Resetear desde padre
          </Button>
          {resetCompletado && <span> Reset completado</span>}
        </Box>
      </Container>
    </>
  );
}

export default App;