import { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Paper, Typography, TextField, MenuItem, Select, FormControl, Button, IconButton, Alert, Card, CardMedia } from '@mui/material';
import { RemoveRedEye as ViewIcon, VisibilityOff as HideIcon, CloudUpload as UploadIcon, ContentCopy as PasteIcon,
DeleteOutline as DeleteIcon, PictureAsPdf as PdfIcon, Collections as ImageIcon, InsertDriveFile as FileIcon, CalendarToday as CalendarIcon, Phone as PhoneIcon } from '@mui/icons-material';
import { useBancos } from '../Hooks/useBancos';
import SearchUser from './SearchUser';

// Función para obtener la fecha actual en formato YYYY-MM-DD
const getFechaActual = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Función para convertir archivo a base64 (necesaria para onVoucherChange)
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

const FormularioMetodoPago = ({ 
  modoPago, 
  onModoPagoChange,
  montoRecibido,
  onMontoChange,
  fechaActual,
  onFechaChange,
  cuentaBancaria,
  onCuentaBancariaChange, 
  bancoSeleccionado, 
  onBancoChange, 
  ultimosDigitos, 
  onDigitosChange,
  onVoucherChange,
  onSinVoucherChange,
  onUsuarioSeleccionado,
  onValidacionCambio,
  onBusquedaIniciada,
  telefonoCliente,
  onTelefonoChange,
  resetTrigger = 0, 
  onResetCompletado, 
  debugMode = false 
}) => {

  const [clienteValido, setClienteValido] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [busquedaActiva, setBusquedaActiva] = useState(false);
  const [ocrError, setOcrError] = useState(null);
  const [voucherFile, setVoucherFile] = useState(null);
  const [voucherPegado, setVoucherPegado] = useState(false);
  const [voucherPreview, setVoucherPreview] = useState(null);
  const [mostrarVoucher, setMostrarVoucher] = useState(false);
  const [sinVoucher, setSinVoucher] = useState(false);
  const lastResetTriggerRef = useRef(0);
  const isResettingRef = useRef(false);
  const searchUserRef = useRef(null);
  const modoPagoAnteriorRef = useRef(modoPago); 
  const { bancos, cargando, error } = useBancos();

const convertirFechaOCR = (fechaTexto) => {
  if (!fechaTexto) return '';
  console.log('🔍 Entrando a convertirFechaOCR con:', fechaTexto);

  const meses = {
    // Español
    enero: '01', febrero: '02', marzo: '03', abril: '04',
    mayo: '05', junio: '06', julio: '07', agosto: '08',
    septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12',
    // Abreviaciones comunes
    ene: '01', feb: '02', mar: '03', abr: '04',
    may: '05', jun: '06', jul: '07', ago: '08',
    sep: '09', oct: '10', nov: '11', dic: '12',
    // Con punto (ene., feb., etc.)
    'ene.': '01', 'feb.': '02', 'mar.': '03', 'abr.': '04',
    'may.': '05', 'jun.': '06', 'jul.': '07', 'ago.': '08',
    'sep.': '09', 'oct.': '10', 'nov.': '11', 'dic.': '12',
    // Inglés (por si acaso)
    jan: '01', feb: '02', mar: '03', apr: '04',
    may: '05', jun: '06', jul: '07', aug: '08',
    sep: '09', oct: '10', nov: '11', dec: '12'
  };

  // 1. Formato largo: "día de mes de año" (ej. 27 de diciembre de 2025)
  let match = fechaTexto.toLowerCase().match(/(\d{1,2})\s+de\s+([a-záéíóú]+)\s+de\s+(\d{4})/);
  console.log('📌 Match largo:', match);
  if (match) {
    const dia = match[1].padStart(2, '0');
    const mes = meses[match[2]] || '01';
    const año = match[3];
    return `${año}-${mes}-${dia}`;
  }

  // 2. Formato: "Mes día de año" (ej. Febrero 20 de 2026) - más tolerante
  match = fechaTexto.toLowerCase().match(/([a-záéíóú]+)\s+(\d{1,2})\s+de\s+(\d{4})/);
  console.log('📌 Match mes-día-año:', match);
  if (match) {
    const mes = meses[match[1]] || '01';
    const dia = match[2].padStart(2, '0');
    const año = match[3];
    return `${año}-${mes}-${dia}`;
  }

  // 3. Formato corto: "DD MES AAAA" (ej. 09 Feb 2026, 08 ene. 2026)
  match = fechaTexto.toLowerCase().match(/(\d{1,2})\s+([a-záéíóú]{3,}\.?)\s+(\d{4})/);
  console.log('📌 Match corto:', match);
  if (match) {
    const dia = match[1].padStart(2, '0');
    let mesRaw = match[2].replace(/\.$/, '');
    const mes = meses[mesRaw] || '01';
    const año = match[3];
    return `${año}-${mes}-${dia}`;
  }

  // 4. Formato ISO (YYYY-MM-DD)
  match = fechaTexto.match(/(\d{4})-(\d{2})-(\d{2})/);
  console.log('📌 Match ISO:', match);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }

  // 5. Formato DD/MM/AAAA
  match = fechaTexto.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  console.log('📌 Match DD/MM/AAAA:', match);
  if (match) {
    const dia = match[1].padStart(2, '0');
    const mes = match[2].padStart(2, '0');
    const año = match[3];
    return `${año}-${mes}-${dia}`;
  }

  console.warn('⚠️ Formato de fecha no reconocido:', fechaTexto);
  return '';
};

const enviarAOCR = async (file) => {
  // 🆕 Limpiar campos del OCR anterior
  if (onMontoChange) onMontoChange({ target: { value: '' } });
  if (onFechaChange) onFechaChange('');
  if (onDigitosChange) onDigitosChange({ target: { value: '' } });
  if (onBancoChange) onBancoChange('');
  setOcrError(null); // Limpiar error anterior

  try {
    const formData = new FormData();
    formData.append("image", file);

    const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:3001";
    const response = await fetch(`${apiUrl}/api/upload`, {
      method: "POST",
      body: formData
    });

    // Validar respuesta HTTP
    if (!response.ok) {
      let errorMsg = `Error del servidor (${response.status})`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.mensaje || errorMsg;
      } catch {
        // Ignorar si no se puede parsear JSON
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    console.log("🧾 Resultado OCR:", data);

    // Si el backend responde con estado "error"
    if (data.estado === "error") {
      throw new Error(data.mensaje || "Error al procesar el voucher");
    }

    // Si la respuesta no tiene la estructura esperada, igual intentamos extraer campos
    const datos = data.datos || data; // Compatibilidad con ambos formatos

    // 1️⃣ MONTO
    if (datos.monto && onMontoChange) {
      const montoFormateado = datos.monto.toLocaleString("es-CO");
      onMontoChange({ target: { value: montoFormateado } });
    }

    // 2️⃣ FECHA
    if (datos.fecha && onFechaChange) {
      const fechaFormateada = convertirFechaOCR(datos.fecha);
      if (fechaFormateada) {
        onFechaChange(fechaFormateada);
      }
    }

    // 3️⃣ OBTENER NÚMERO PARA ÚLTIMOS 4 DÍGITOS
    const numero = datos.destino || datos.cuenta || datos.referencia;
    console.log("🔢 Número para últimos 4:", numero);

    if (numero) {
      const soloNumeros = numero.replace(/\D/g, '');
      if (soloNumeros.length >= 4) {
        const ultimos4 = soloNumeros.slice(-4);
        console.log("🔎 Últimos 4:", ultimos4);

        if (onDigitosChange) {
          onDigitosChange({ target: { value: ultimos4 } });
        }

        // 4️⃣ SELECCIÓN AUTOMÁTICA DE BANCO
        if (bancos && bancos.length > 0) {
          console.log("🏦 Bancos disponibles:", bancos);
          console.log("🔎 Buscando cuenta con últimos 4:", ultimos4);

          let cuentaSeleccionada = bancos.find(
            cuenta => cuenta.ultimos4 && cuenta.ultimos4 === ultimos4
          );

          if (!cuentaSeleccionada && datos.banco) {
            const nombreBanco = datos.banco.toLowerCase();
            console.log("🔍 Fallback por nombre:", nombreBanco);
            cuentaSeleccionada = bancos.find(cuenta =>
              cuenta.nombreBanco?.toLowerCase().includes(nombreBanco)
            );
          }

          if (cuentaSeleccionada && onBancoChange) {
            console.log("🏦 Cuenta detectada:", cuentaSeleccionada);
            onBancoChange(cuentaSeleccionada.id);
          } else {
            console.warn("⚠️ No se encontró ninguna cuenta");
          }
        }
      }
    }
  } catch (error) {
    console.error("❌ Error en enviarAOCR:", error);
    setOcrError(error.message);
  }
};
  //Función principal para resetear TODO el componente
  const resetearTodoElComponente = useCallback(() => {
    if (isResettingRef.current) {
      if (debugMode) console.log("🔄 Reset ya en progreso, ignorando...");
      return;
    }
    
    isResettingRef.current = true;
    
    try {
      if (debugMode) console.log("🔄🚀 INICIANDO RESET COMPLETO DE FormularioMetodoPago");
      
      // 1. Resetear estados internos
      setClienteValido(false);
      setUsuarioSeleccionado(null);
      setBusquedaActiva(false);
      // 2. Resetear estados del voucher
      setVoucherFile(null);
      setVoucherPegado(false);
      setVoucherPreview(null);
      setMostrarVoucher(false);
      setSinVoucher(false);
      
      // 3. Forzar nueva key para el input de archivo
      const nuevaKey = Date.now();
      setFileInputKey(nuevaKey);
      
      // 4. Limpiar inputs manualmente
      setTimeout(() => {
        // Limpiar input de archivo
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
          if (input) input.value = '';
        });
        
        // Notificar a SearchUser si tiene método de reset
        if (searchUserRef.current && typeof searchUserRef.current.reset === 'function') {
          searchUserRef.current.reset();
        }
      }, 50);
      
      // 5. Notificar al padre sobre cambios
      if (onUsuarioSeleccionado) {
        onUsuarioSeleccionado(null);
      }
      if (onValidacionCambio) {
        onValidacionCambio(false);
      }
      if (onVoucherChange) {
        onVoucherChange(null);
      }
      if (onSinVoucherChange) {
        onSinVoucherChange(false);
      }
      
      // Restaurar la fecha según el modo de pago actual
      if (modoPago === "cash" || modoPago === "card-reader") {
        const fechaHoy = getFechaActual();
        if (debugMode) console.log(`📅 Restaurando fecha actual para ${modoPago}: ${fechaHoy}`);
        if (onFechaChange) {
          onFechaChange(fechaHoy);
        }
      } else if (modoPago === "transfer") {
        if (debugMode) console.log("📅 Restaurando fecha vacía para transferencia");
        if (onFechaChange) {
          onFechaChange('');
        }
      }
      
      if (debugMode) console.log("✅ RESET COMPLETO DE FormularioMetodoPago FINALIZADO");
      
    } catch (error) {
      console.error("❌ Error durante el reset de FormularioMetodoPago:", error);
    } finally {
      // 7. Notificar al padre que el reset se completó
      if (onResetCompletado) {
        setTimeout(() => {
          onResetCompletado();
        }, 100);
      }
      
      isResettingRef.current = false;
    }
  }, [
    onUsuarioSeleccionado, 
    onValidacionCambio, 
    onVoucherChange, 
    onSinVoucherChange,
    onFechaChange,
    modoPago,
    onResetCompletado,
    debugMode
  ]);

  //Se ejecuta cuando resetTrigger cambia
  useEffect(() => {
    if (resetTrigger > lastResetTriggerRef.current) {
      if (debugMode) console.log(`🔄🔔 Recibido resetTrigger: ${resetTrigger} (anterior: ${lastResetTriggerRef.current})`);
      
      lastResetTriggerRef.current = resetTrigger;
      resetearTodoElComponente();
    }
  }, [resetTrigger, resetearTodoElComponente, debugMode]);

  //Si el padre resetea props individuales, debemos sincronizar
  useEffect(() => {
    // Si el padre borró el ID del cliente pero nosotros tenemos uno seleccionado
    if (!onUsuarioSeleccionado && usuarioSeleccionado) {
      if (debugMode) console.log("🔄 Sincronización: Padre borró cliente, reseteando interno");
      setUsuarioSeleccionado(null);
      setClienteValido(false);
    }
    // Si el voucher se resetea en el padre (props vacías pero tenemos voucher)
    if (!onVoucherChange && (voucherFile || voucherPegado)) {
      if (debugMode) console.log("🔄 Sincronización: Padre reseteó voucher");
      setVoucherFile(null);
      setVoucherPegado(false);
      setVoucherPreview(null);
    }
    
  }, [onUsuarioSeleccionado, montoRecibido, telefonoCliente, onVoucherChange, usuarioSeleccionado, voucherFile, voucherPegado, debugMode]);

  // Este efecto se ejecuta cuando cambia modoPago
  useEffect(() => {
    // Solo actuar si realmente cambió el modo (no en el montaje inicial)
    if (modoPago !== modoPagoAnteriorRef.current) {
      if (debugMode) console.log(`🔄 Modo de pago cambió: ${modoPagoAnteriorRef.current} -> ${modoPago}`);
      
      // Actualizar la referencia
      modoPagoAnteriorRef.current = modoPago;
      
      // Lógica para manejar la fecha según el nuevo modo
      if (modoPago === "transfer") {
        // MODO TRANSFERENCIA: La fecha debe venir VACÍA
        if (debugMode) console.log("📅 Transferencia seleccionada: Estableciendo fecha VACÍA");
        if (onFechaChange) {
          onFechaChange(''); // Vaciar la fecha
        }
      } else if (modoPago === "card-reader" || modoPago === "cash") {
        // MODO DATAFONO o EFECTIVO: La fecha debe ser el día ACTUAL
        const fechaHoy = getFechaActual();
        if (debugMode) console.log(`📅 ${modoPago === "card-reader" ? "Datafono" : "Efectivo"} seleccionado: Estableciendo fecha actual: ${fechaHoy}`);
        if (onFechaChange) {
          onFechaChange(fechaHoy);
        }
      }
    }
  }, [modoPago, onFechaChange, debugMode]);

  //EFECTO 3: Selección automática de cuenta para efectivo
  useEffect(() => {
    if (modoPago === "cash") {
      const getSedeUsuario = () => {
        try {
          const userDataStr = localStorage.getItem("userData");
          if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            if (userData.sede_user) return userData.sede_user;
            if (userData.sede) return userData.sede;
            if (userData.sedeId) return userData.sedeId;
            if (userData.sede_id) return userData.sede_id;
            if (userData.branch) return userData.branch;
            if (userData.branch_id) return userData.branch_id;
          }
          
          const userSedeStr = localStorage.getItem("userSede");
          if (userSedeStr) {
            try {
              return JSON.parse(userSedeStr);
            } catch {
              return parseInt(userSedeStr) || null;
            }
          }
          
          return null;
        } catch (error) {
          console.error("Error al obtener la sede del usuario:", error);
          return null;
        }
      };
      
      const sede = getSedeUsuario();
      if (debugMode) console.log("🏢 Sede detectada para selección automática:", sede);
      
      if (onCuentaBancariaChange) {
        if (sede === 1 || sede === "1") {
          if (debugMode) console.log("💰 Seleccionando CAJA VENTAS para sede principal");
          onCuentaBancariaChange("CAJA VENTAS");
        } else if (sede === 3 || sede === "3") {
          if (debugMode) console.log("💰 Seleccionando CAJA BULEVAR para sede bulevar");
          onCuentaBancariaChange("CAJA BULEVAR");
        } else {
          if (debugMode) console.warn("⚠️ No se pudo determinar la sede, usando CAJA VENTAS por defecto");
          onCuentaBancariaChange("CAJA VENTAS");
        }
      }
    }
  }, [modoPago, onCuentaBancariaChange, debugMode]);

  //EFECTO 4: Establecer cuenta bancaria para transferencia
  useEffect(() => {
    if (modoPago === "transfer" && bancoSeleccionado) {
      const bancoEncontrado = bancos.find(
        banco => (banco.id || banco.id_bank) === bancoSeleccionado
      );
      
      if (bancoEncontrado && onCuentaBancariaChange) {
        const nombreBanco = bancoEncontrado.name || bancoEncontrado.name_bank;
        if (debugMode) console.log("🏦 Transferencia - Estableciendo cuenta:", nombreBanco);
        onCuentaBancariaChange(nombreBanco);
      }
    }
  }, [bancoSeleccionado, modoPago, bancos, onCuentaBancariaChange, debugMode]);

  const manejarCambioBusqueda = (inputValue) => {
    if (inputValue && inputValue.length > 2 && !busquedaActiva) {
      setBusquedaActiva(true);
      if (onBusquedaIniciada) {
        onBusquedaIniciada();
      }
    }
    
    if (!inputValue || inputValue.length === 0) {
      setBusquedaActiva(false);
      // Si se borra la búsqueda, resetear cliente
      if (usuarioSeleccionado) {
        setUsuarioSeleccionado(null);
        setClienteValido(false);
        if (onUsuarioSeleccionado) {
          onUsuarioSeleccionado(null);
        }
        if (onValidacionCambio) {
          onValidacionCambio(false);
        }
      }
    }
  };

  const manejarSeleccionUsuario = (usuario) => {
    // Si se pasa null explícitamente, es un reset
    if (usuario === null) {
      setUsuarioSeleccionado(null);
      setClienteValido(false);
      setBusquedaActiva(false);
      
      if (onUsuarioSeleccionado) {
        onUsuarioSeleccionado(null);
      }
      if (onValidacionCambio) {
        onValidacionCambio(false);
      }
      return;
    }
    
    // Caso normal: usuario seleccionado
    setUsuarioSeleccionado(usuario);
    setClienteValido(true);
    setBusquedaActiva(false);
    
    if (onUsuarioSeleccionado) {
      onUsuarioSeleccionado(usuario);
    }
    if (onValidacionCambio) {
      onValidacionCambio(true);
    }
    
    if (debugMode) console.log("👤 Usuario seleccionado:", usuario.name_contact);
  };

  const manejarValidacionUsuario = (esValido) => {
    setClienteValido(esValido);
    if (onValidacionCambio) {
      onValidacionCambio(esValido);
    }
  };

  const handleVoucherUpload = async (e) => { 
    const file = e.target.files[0];
    if (!file) return;

    try {
      if (!file.type.match(/^image\/(jpeg|png|gif|bmp|webp)|^application\/pdf$/)) {
        alert('Solo se permiten archivos de imagen o PDF');
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo 2MB');
        return;
      }

      setVoucherFile(file);
      setVoucherPegado(false);
      setSinVoucher(false);
      await enviarAOCR(file);
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setVoucherPreview(e.target.result);
        };
        reader.readAsDataURL(file);
      } else {
        setVoucherPreview(null);
      }
      
      try {
        const base64 = await fileToBase64(file);
        if (onVoucherChange) {
          onVoucherChange({
            file: file,
            base64: base64,
            fileName: file.name,
            fileType: file.type
          });
        }
      } catch (error) {
        console.error('Error convirtiendo voucher a base64:', error);
      }
      
    } catch (error) {
      console.error('Error procesando archivo:', error);
      alert('Error al procesar el archivo');
    }
  };

  const handlePasteVoucher = async () => {
    try {
      const items = await navigator.clipboard.read();
      
      for (const item of items) {
        if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
          const blob = await item.getType('image/png');
          const file = new File([blob], 'voucher.png', { type: blob.type });
          await enviarAOCR(file);
          
          setVoucherFile(file);
          setVoucherPegado(true);
          setSinVoucher(false);
          
          const reader = new FileReader();
          reader.onload = (e) => {
            setVoucherPreview(e.target.result);
          };
          reader.readAsDataURL(blob);
          
          try {
            const base64 = await fileToBase64(file);
            if (onVoucherChange) {
              onVoucherChange({
                file: file,
                base64: base64,
                fileName: 'voucher.png',
                fileType: blob.type
              });
            }
          } catch (error) {
            console.error('Error convirtiendo voucher pegado a base64:', error);
          }
          break;
        }
      }
    } catch (error) {
      console.error('Error pegando desde portapapeles:', error);
      alert('No se pudo pegar un voucher desde el portapapeles. Asegúrese de que tiene una imagen copiada.');
    }
  };

  const handleToggleVoucher = () => {
    setMostrarVoucher(!mostrarVoucher);
  };

  const handleRemoveVoucher = () => {
    setVoucherFile(null);
    setVoucherPegado(false);
    setVoucherPreview(null);
    setMostrarVoucher(false);
    if (onVoucherChange) {
      onVoucherChange(null);
    }
  };

  const handleSinVoucherToggle = () => {
    const newValue = !sinVoucher;
    setSinVoucher(newValue);
    if (newValue) {
      setVoucherFile(null);
      setVoucherPegado(false);
      setVoucherPreview(null);
      if (onVoucherChange) {
        onVoucherChange(null);
      }
    }
    if (onSinVoucherChange) {
      onSinVoucherChange(newValue);
    }
  };

  const manejarEliminarVoucher = () => {
    try {
      handleRemoveVoucher();
      setFileInputKey(Date.now());
    } catch (error) {
      console.error('Error al eliminar voucher:', error);
      setFileInputKey(Date.now());
      if (onVoucherChange) onVoucherChange(null);
    }
  };

  const obtenerTipoArchivo = (fileName) => {
    if (!fileName) return 'desconocido';
    if (fileName.toLowerCase().endsWith('.pdf')) return 'pdf';
    if (fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) return 'imagen';
    return 'desconocido';
  };

  const obtenerNombreArchivo = () => {
    if (voucherFile) return voucherFile.name;
    if (voucherPegado) return 'Voucher pegado desde portapapeles';
    return '';
  };

  const formatearValor = (valor) => {
    const soloNumeros = valor.replace(/\D/g, "");
    if (soloNumeros === '') return '';
    return parseInt(soloNumeros).toLocaleString('es-CO');
  };

  const manejarCambioMonto = (e) => {
    const valorFormateado = formatearValor(e.target.value);
    if (onMontoChange) {
      onMontoChange({ target: { value: valorFormateado } });
    }
  };

  const manejarCambioFecha = (e) => {
    const nuevaFecha = e.target.value;
    if (debugMode) console.log('📅 Nueva fecha seleccionada:', nuevaFecha);
    if (onFechaChange) {
      onFechaChange(nuevaFecha);
    } else {
      console.error('Error: onFechaChange no está definido en las props');
    }
  };

  const manejarCambioTelefono = (e) => {
    const nuevoTelefono = e.target.value;
    if (debugMode) console.log('📞 Nuevo teléfono ingresado:', nuevoTelefono);
    if (onTelefonoChange) {
      onTelefonoChange(nuevoTelefono);
    }
  };

  const abrirDatePicker = () => {
    const input = document.getElementById('fecha-pago-input');
    if (input && !fechaDeshabilitada) {
      input.showPicker();
    }
  };

  const tipoArchivo = obtenerTipoArchivo(obtenerNombreArchivo());
  const nombreArchivo = obtenerNombreArchivo();
  const mostrarDetallesBancarios = modoPago === "transfer" || modoPago === "card-reader";
  const mostrarBotones = !voucherFile && !voucherPegado && mostrarDetallesBancarios;
  const mostrarContenedorArchivo = (voucherFile || voucherPegado) && mostrarDetallesBancarios;
  const mostrarCuentaBancariaEfectivo = modoPago === "cash";

  // Determinar si la fecha debe estar deshabilitada (solo lectura)
  const fechaDeshabilitada = modoPago === "cash" || modoPago === "card-reader";

  return (
      <Paper 
        sx={{ 
          position: 'relative',
          border: '2px solid #0B6BAA',
          borderRadius: '8px',
          marginTop: '7px',
          marginBottom: 1,
          backgroundColor: '#fff',
          padding: 1.25,
          paddingTop: '15px',
          overflow: 'visible',
          boxShadow: 'none',
          '&::before': {
            content: '"INFORMACIÓN GENERAL"',
            position: 'absolute',
            top: '-12px',
            left: '15px',
            backgroundColor: '#fff',
            padding: '0 8px',
            color: '#0B6BAA',
            fontWeight: 'bold',
            fontSize: '16px',
            letterSpacing: '0.5px',
            zIndex: 1
          }
        }}
      >
      {/* DEBUG INFO (solo en modo debug) */}
      {debugMode && (
        <Box sx={{
          position: 'absolute',
          top: -25,
          right: 10,
          bgcolor: 'warning.light',
          color: 'warning.contrastText',
          fontSize: '10px',
          px: 1,
          py: 0.5,
          borderRadius: '4px',
          zIndex: 1000
        }}>
          ResetTrigger: {resetTrigger} | Modo: {modoPago} | Fecha: {fechaActual || 'VACÍA'}
        </Box>
      )}

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* PRIMERA FILA */}
        <Box sx={{ 
          display: 'flex', 
          gap: 1.5, 
          width: '100%', 
          flexWrap: 'wrap',
          mb: mostrarDetallesBancarios ? 1 : 0,
          alignItems: 'flex-start'
        }}>
          {/* CLIENTE */}
          <FormControl sx={{ 
            flex: '0 0 385px',
            minWidth: 385,
            position: 'relative',
            minHeight: '72px'
          }}>
            <Typography component="label" sx={{  textAlign: 'center', fontWeight: 'bold', mb: 0.6, fontSize: '14px', display: 'block' }}>
              CLIENTE:
            </Typography>
            <Box sx={{ 
              position: 'relative',
              height: '40px',
              '& > *': {
                height: '40px !important',
                minHeight: '40px !important',
              },
              '& .MuiInputBase-root': {
                height: '40px !important',
                minHeight: '40px !important',
              },
              '& .MuiInputBase-input': {
                height: '40px !important',
                minHeight: '40px !important',
                padding: '8px 12px !important',
                boxSizing: 'border-box !important',
                display: 'flex !important',
                alignItems: 'center !important'
              },
              '& input': {
                height: '40px !important',
                minHeight: '40px !important',
                padding: '8px 12px !important'
              }
            }}>
              <SearchUser
                ref={searchUserRef}
                onUsuarioSeleccionado={manejarSeleccionUsuario}
                onValidacionCambio={manejarValidacionUsuario}
                onChange={manejarCambioBusqueda}
                requerido={true}
                placeholder="Buscar por Nombre o Cédula..."
                dropdownZIndex={1000}
                // Nueva prop para reset desde aquí
                externalResetTrigger={resetTrigger}
                sx={{
                  height: '40px !important',
                  minHeight: '40px !important',
                  '& .MuiInputBase-root': {
                    height: '40px !important',
                    minHeight: '40px !important',
                  },
                  '& .MuiInputBase-input': {
                    height: '40px !important',
                    minHeight: '40px !important',
                    padding: '8px 12px !important',
                    boxSizing: 'border-box !important'
                  }
                }}
              />
            </Box>
          </FormControl>

          {/* FORMA DE PAGO */}
          <FormControl sx={{ 
            flex: '1.2',
            minWidth: 170,
            minHeight: '72px'
          }}>
            <Typography component="label" sx={{  textAlign: 'center', fontWeight: 'bold', mb: 0.6, fontSize: '14px', display: 'block' }}>
              FORMA DE PAGO:
            </Typography>
            <Select
              value={modoPago}
              onChange={(e) => onModoPagoChange(e.target.value)}
              sx={{ 
                '& .MuiSelect-select': { 
                  py: 1,
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  minWidth: '120px',
                  paddingRight: '32px !important',
                },
                height: '40px',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#ccc',
                }
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    '& .MuiMenuItem-root': {
                      whiteSpace: 'nowrap',
                      minWidth: '150px'
                    }
                  }
                }
              }}
            >
              <MenuItem value="cash">EFECTIVO</MenuItem>
              <MenuItem value="transfer">TRANSFERENCIA</MenuItem>
              <MenuItem value="card-reader">DATAFONO</MenuItem>
            </Select>
          </FormControl>

          {/* MONTO RECIBIDO */}
          <FormControl sx={{ 
            flex: '0.7',
            minWidth: 130,
            minHeight: '72px'
          }}>
            <Typography component="label" sx={{ 
               textAlign: 'center',
              fontWeight: 'bold', 
              mb: 0.6, 
              fontSize: '14px', 
              display: 'block',
              whiteSpace: 'nowrap'
            }}>
              VALOR RECIBIDO:
            </Typography>
            <TextField
              type="text"
              placeholder="$0"
              value={montoRecibido || ''}
              onChange={manejarCambioMonto}
              sx={{ 
                '& .MuiInputBase-root': {
                  height: '40px'
                },
                '& .MuiInputBase-input': { 
                  py: 1,
                  height: '40px',
                  boxSizing: 'border-box',
                  textAlign: 'right',
                  fontSize: '14px',
                  fontWeight: 600,
                  paddingRight: '12px',
                  width: '100%'
                },
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: '#007bff',
                  }
                }
              }}
            />
          </FormControl>

          {/* FECHA - MODIFICADO */}
          <FormControl sx={{ 
            flex: '1.1',
            minWidth: 140,
            minHeight: '72px'
          }}>
            <Typography component="label" sx={{ 
              textAlign: 'center',
              fontWeight: 'bold', 
              mb: 0.6, 
              fontSize: '14px', 
              display: 'block',
              whiteSpace: 'nowrap'
            }}>
              FECHA:
            </Typography>
            <Box sx={{ position: 'relative', width: '100%' }}>
              <TextField
                id="fecha-pago-input"
                type="date"
                value={fechaActual || ''}
                onChange={manejarCambioFecha}
                disabled={fechaDeshabilitada}
                placeholder={modoPago === "transfer" ? "Seleccione fecha" : ""}
                sx={{ 
                  width: '100%',
                  '& .MuiInputBase-root': {
                    height: '40px',
                    width: '100%',
                    position: 'relative',
                    zIndex: 1,
                    backgroundColor: 'white',
                    // Eliminar opacidad cuando está disabled
                    '&.Mui-disabled': {
                      backgroundColor: 'white',
                      opacity: 1,
                    }
                  },
                  '& .MuiInputBase-input': { 
                    py: 1,
                    height: '40px',
                    boxSizing: 'border-box',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#000000',
                    cursor: fechaDeshabilitada ? 'default' : 'pointer',
                    opacity: 1,
                    WebkitTextFillColor: '#000000',
                    paddingRight: '40px',
                    width: '100%',
                    minWidth: '120px',
                    // Mantener color normal cuando está disabled
                    '&.Mui-disabled': {
                      color: '#000000',
                      WebkitTextFillColor: '#000000',
                      opacity: 1,
                    },
                    // Placeholder para cuando está vacío
                    '&::placeholder': {
                      color: '#999',
                      opacity: 1,
                      fontWeight: 'normal',
                    }
                  },
                  '& input[type="date"]': {
                    minWidth: '120px'
                  },
                  '& .MuiInputAdornment-root': {
                    position: 'absolute',
                    right: '8px',
                    zIndex: 2,
                    pointerEvents: fechaDeshabilitada ? 'none' : 'auto'
                  },
                  '& input[type="date"]::-webkit-calendar-picker-indicator': {
                    background: 'transparent',
                    color: 'transparent',
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    width: '100%',
                    height: '100%',
                    cursor: fechaDeshabilitada ? 'default' : 'pointer',
                    zIndex: 3,
                    // Ocultar el picker cuando está deshabilitado
                    opacity: fechaDeshabilitada ? 0 : 1
                  },
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: '#007bff'
                    },
                    // Estilo del borde cuando está disabled
                    '&.Mui-disabled .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(0, 0, 0, 0.23)'
                    }
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={abrirDatePicker}
                      disabled={fechaDeshabilitada}
                      sx={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 2,
                        padding: '4px',
                        color: '#666',
                        '&:hover': {
                          backgroundColor: 'transparent',
                          color: '#1976d2'
                        },
                        '&.Mui-disabled': {
                          color: '#666',
                          opacity: 0.5
                        }
                      }}
                      size="small"
                    >
                      <CalendarIcon fontSize="small" />
                    </IconButton>
                  ),
                }}
              />
            </Box>
          </FormControl>

          {/* TELÉFONO */}
          <FormControl sx={{ 
            flex: '1',
            minWidth: 140,
            minHeight: '72px'
          }}>
            <Typography component="label" sx={{  textAlign: 'center', fontWeight: 'bold', mb: 0.6, fontSize: '14px', display: 'block' }}>
              TELÉFONO:
            </Typography>
            <TextField
              type="text"
              value={telefonoCliente || ''}
              onChange={manejarCambioTelefono}
              InputProps={{
                startAdornment: (
                  <PhoneIcon sx={{ 
                    fontSize: 18, 
                    color: '#666', 
                    mr: 1,
                    opacity: 0.7
                  }} />
                ),
              }}
              sx={{ 
                '& .MuiInputBase-root': {
                  height: '40px',
                },
                '& .MuiInputBase-input': { 
                  py: 1,
                  height: '40px',
                  boxSizing: 'border-box',
                  fontSize: '14px',
                  fontWeight: 600,
                },
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: '#007bff',
                  },
                  '&:hover fieldset': {
                    borderColor: '#1976d2',
                  }
                },
                '& input': {
                  cursor: 'text',
                  color: '#000000 !important',
                  fontWeight: 600,
                  '&:focus': {
                    color: '#000000 !important',
                  },
                  '&:hover': {
                    color: '#000000 !important',
                  }
                }
              }}
              inputProps={{
                maxLength: 15,
              }}
            />
          </FormControl>
        </Box>

        {/* SEGUNDA FILA - SOLO PARA MÉTODOS NO EFECTIVO */}
        {mostrarDetallesBancarios && (
          <Box sx={{ 
            display: 'flex', 
            gap: 1.5,
            width: '100%', 
            flexWrap: 'wrap',
            alignItems: 'flex-start'
          }}>
            <FormControl sx={{ flex: '1 1 128px', minWidth: 128 }}>
              <Typography component="label" sx={{  textAlign: 'center', fontWeight: 'bold', mb: 0.6, fontSize: '14px', display: 'block' }}>
                BANCO:
              </Typography>
              <Select
              value={bancoSeleccionado}
              onChange={(e) => {
                const value = e.target.value;
                if (onBancoChange) onBancoChange(value);
              }}
              disabled={cargando}
              displayEmpty
              sx={{ 
                '& .MuiSelect-select': { 
                  py: 1,
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center'
                },
                height: '40px'
              }}
            >
          <MenuItem value="">
            <span style={{ color: '#000' }}>SELECCIONE UNA CUENTA</span>
          </MenuItem>
          {error ? (
            <MenuItem disabled>Error cargando cuentas</MenuItem>
            ) : (
            bancos.map((cuenta) => (
           <MenuItem key={cuenta.id} value={cuenta.id}>
            {cuenta.nombreMostrar}
            </MenuItem>
            ))
            )}
            </Select>
              {cargando && (
                <Typography sx={{ fontSize: '12px', color: '#666', fontStyle: 'italic', mt: 0.5 }}>
                  Cargando bancos...
                </Typography>
              )}
              {error && (
                <Alert severity="error" sx={{ fontSize: '12px', py: 0, mt: 0.5 }}>{error}</Alert>
              )}
            </FormControl>

            <FormControl sx={{ flex: '0 0 180px', minWidth: 180 }}>
              <Typography component="label" sx={{  textAlign: 'center', fontWeight: 'bold', mb: 0.6, fontSize: '14px', display: 'block' }}>
                ÚLTIMOS 4 DÍGITOS:
              </Typography>
              <TextField
                type="text"
                inputProps={{ maxLength: 6 }}
                placeholder="Ej: 1234"
                value={ultimosDigitos}
                onChange={onDigitosChange}
                sx={{ 
                  '& .MuiInputBase-root': {
                    height: '40px'
                  },
                  '& .MuiInputBase-input': { 
                    py: 1,
                    height: '40px',
                    boxSizing: 'border-box'
                  }
                }}
              />
            </FormControl>

            <FormControl sx={{ 
              flex: '1 1 240px', 
              minWidth: 240,
              minHeight: '72px'
            }}>
              <Typography component="label" sx={{  textAlign: 'center', fontWeight: 'bold', mb: 0.6, fontSize: '14px', display: 'block' }}>
                COMPROBANTE DE PAGO:
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 1,
                minHeight: '40px'
              }}>
                
                {/* BOTONES DE ACCIÓN */}
                {mostrarBotones && !voucherFile && !voucherPegado && (
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 0.8,
                    alignItems: 'center', 
                    flexWrap: 'nowrap',
                    height: '40px',
                    width: '100%'
                  }}>
                    {/* BOTÓN SUBIR */}
                    <Button
                      variant="outlined"
                      startIcon={<UploadIcon />}
                      onClick={() => document.getElementById(`archivoVoucher-${fileInputKey}`).click()}
                      sx={{
                        flex: 1,
                        minWidth: 'auto',
                        px: 1.2,
                        py: 0.75,
                        fontSize: '13px',
                        backgroundColor: 'transparent',
                        borderColor: '#1976d2',
                        color: '#1976d2',
                        fontWeight: '600',
                        transition: 'all 0.2s ease',
                        borderWidth: '2px',
                        '&:hover': {
                          backgroundColor: '#e3f2fd',
                          borderColor: '#1976d2',
                        },
                        height: '40px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      SUBIR
                    </Button>
                    
                    {/* BOTÓN PEGAR */}
                    <Button
                      variant="outlined"
                      startIcon={<PasteIcon />}
                      onClick={handlePasteVoucher}
                      sx={{
                        flex: 1,
                        minWidth: 'auto',
                        px: 1.0,
                        py: 0.75,
                        fontSize: '13px',
                        backgroundColor: 'transparent',
                        borderColor: '#ed6c02',
                        color: '#ed6c02',
                        fontWeight: '600',
                        transition: 'all 0.2s ease',
                        borderWidth: '2px',
                        '&:hover': {
                          backgroundColor: '#fff3e0',
                          borderColor: '#ed6c02',
                        },
                        height: '40px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      PEGAR
                    </Button>

                    {/* BOTÓN NO IMAGEN */}
                    <Button
                      variant={sinVoucher ? "contained" : "outlined"}
                      onClick={handleSinVoucherToggle}
                      sx={{
                        flex: 1,
                        minWidth: 'auto',
                        px: 1.2,
                        py: 0.75,
                        fontSize: '13px',
                        fontWeight: '600',
                        height: '40px',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s ease',
                        backgroundColor: sinVoucher ? '#d32f2f' : 'transparent',
                        borderColor: '#d32f2f',
                        color: sinVoucher ? 'white' : '#d32f2f',
                        borderWidth: '2px',
                        '&:hover': {
                          backgroundColor: sinVoucher ? '#b71c1c' : '#ffebee',
                          borderColor: sinVoucher ? '#b71c1c' : '#d32f2f',
                          color: sinVoucher ? 'white' : '#d32f2f',
                        },
                      }}
                    >
                      NO IMAGEN
                    </Button>

                    <input
                      key={fileInputKey}
                      type="file"
                      id={`archivoVoucher-${fileInputKey}`}
                      style={{ display: "none" }}
                      onChange={handleVoucherUpload}
                      accept="image/*,.pdf"
                    />
                  </Box>
                )}

                {/* CONTENEDOR DEL ARCHIVO */}
                {mostrarContenedorArchivo && (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.75, 
                    p: '8px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    backgroundColor: '#f8f9fa',
                    height: '40px',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    {/* Icono del tipo de archivo */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      width: 22,
                      height: 22,
                      borderRadius: '3px',
                      backgroundColor: 'transparent',
                      color: '#212529',
                      border: '1px solid #212529',
                      flexShrink: 0
                    }}>
                      {tipoArchivo === 'pdf' ? (
                        <PdfIcon sx={{ fontSize: 12 }} />
                      ) : tipoArchivo === 'imagen' ? (
                        <ImageIcon sx={{ fontSize: 12 }} />
                      ) : (
                        <FileIcon sx={{ fontSize: 12 }} />
                      )}
                    </Box>

                    {/* Nombre del archivo */}
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        flex: 1,
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#495057',
                        lineHeight: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={nombreArchivo}
                    >
                      {nombreArchivo}
                    </Typography>

                    {/* ICONOS DE ACCIÓN */}
                    <Box sx={{ display: 'flex', gap: 0.2, flexShrink: 0 }}>
                      <IconButton
                        size="small"
                        onClick={handleToggleVoucher}
                        sx={{
                          width: 24,
                          height: 24,
                          backgroundColor: 'transparent',
                          color: '#212529',
                          border: '1px solid #212529',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: '#212529',
                            color: 'white',
                            transform: 'scale(1.05)',
                          }
                        }}
                        title={mostrarVoucher ? "Ocultar voucher" : "Mostrar voucher"}
                      >
                        {mostrarVoucher ? 
                          <HideIcon sx={{ fontSize: 14 }} /> : 
                          <ViewIcon sx={{ fontSize: 14 }} />
                        }
                      </IconButton>
                      
                      <IconButton
                        size="small"
                        onClick={manejarEliminarVoucher}
                        sx={{
                          width: 24,
                          height: 24,
                          backgroundColor: 'transparent',
                          color: '#212529',
                          border: '1px solid #212529',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: '#212529',
                            color: 'white',
                            transform: 'scale(1.05)',
                          }
                        }}
                        title="Eliminar voucher"
                      >
                        <DeleteIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  </Box>
                )}

                {/* PREVIEW DEL VOUCHER */}
                {voucherPreview && mostrarVoucher && mostrarContenedorArchivo && (
                  <Card sx={{ 
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    mt: 1
                  }}>
                    <CardMedia
                      component="img"
                      image={voucherPreview}
                      alt="Voucher preview"
                      sx={{
                        maxWidth: '100%',
                        maxHeight: 200,
                        objectFit: 'contain'
                      }}
                    />
                  </Card>
                )}

                {/* BOTÓN NO IMAGEN - VISIBLE SOLO CUANDO HAY ARCHIVO Y ESTÁ SELECCIONADO "NO IMAGEN" */}
                {mostrarDetallesBancarios && (voucherFile || voucherPegado) && sinVoucher && (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    mt: 0.5
                  }}>
                    <Button
                      variant="contained"
                      onClick={handleSinVoucherToggle}
                      sx={{
                        px: 1.2,
                        py: 0.75,
                        fontSize: '13px',
                        fontWeight: '600',
                        height: '40px',
                        whiteSpace: 'nowrap',
                        minWidth: 'auto',
                        transition: 'all 0.2s ease',
                        backgroundColor: '#d32f2f',
                        borderColor: '#d32f2f',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: '#b71c1c',
                          borderColor: '#b71c1c',
                          color: 'white',
                        },
                      }}
                    >
                      NO IMAGEN (SELECCIONADO)
                    </Button>
                  </Box>
                )}

                {/* BOTÓN NO IMAGEN - VISIBLE CUANDO NO HAY ARCHIVO Y NO ESTÁ EN LA FILA DE BOTONES */}
                {mostrarDetallesBancarios && !voucherFile && !voucherPegado && !mostrarBotones && (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    mt: 0.5
                  }}>
                    <Button
                      variant={sinVoucher ? "contained" : "outlined"}
                      onClick={handleSinVoucherToggle}
                      sx={{
                        px: 1.2,
                        py: 0.75,
                        fontSize: '13px',
                        fontWeight: '600',
                        height: '40px',
                        whiteSpace: 'nowrap',
                        minWidth: 'auto',
                        transition: 'all 0.2s ease',
                        backgroundColor: sinVoucher ? '#d32f2f' : 'transparent',
                        borderColor: '#d32f2f',
                        color: sinVoucher ? 'white' : '#d32f2f',
                        '&:hover': {
                          backgroundColor: sinVoucher ? '#b71c1c' : '#ffebee',
                          borderColor: sinVoucher ? '#b71c1c' : '#d32f2f',
                          color: sinVoucher ? 'white' : '#d32f2f',
                        },
                      }}
                    >
                      NO IMAGEN
                    </Button>
                  </Box>
                )}
              </Box>
            </FormControl>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default FormularioMetodoPago;