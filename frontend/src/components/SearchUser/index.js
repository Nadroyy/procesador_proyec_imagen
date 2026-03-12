import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { TextField } from '@mui/material';

const SearchUser = forwardRef(({
  onUsuarioSeleccionado,
  onValidacionCambio,
  onChange,
  requerido,
  placeholder,
  dropdownZIndex,
  externalResetTrigger,
  sx
}, ref) => {
  const [inputValue, setInputValue] = useState('');

  useImperativeHandle(ref, () => ({
    reset: () => setInputValue('')
  }));

  const handleChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    onChange?.(value);
    
    if (value.length >= 4) {
      onUsuarioSeleccionado?.({ name_contact: 'Cliente de prueba', id: 123 });
      onValidacionCambio?.(true);
    } else {
      onUsuarioSeleccionado?.(null);
      onValidacionCambio?.(false);
    }
  };

  return (
    <TextField
      value={inputValue}
      onChange={handleChange}
      placeholder={placeholder}
      required={requerido}
      fullWidth
      size="small"
      sx={sx}
    />
  );
});

export default SearchUser;