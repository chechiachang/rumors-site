import { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import InputAdornment from '@material-ui/core/InputAdornment';
import { t } from 'ttag';

const useStyles = makeStyles(theme => ({
  root: {
    flexDirection: 'row',
  },
  inputClass: {
    border: `1px solid ${theme.palette.secondary[100]}`,
    background: ({ expand }) =>
      expand ? theme.palette.secondary[100] : theme.palette.common.white,
    transition: 'background .3s',
    borderRadius: 4,
    padding: '0px 10px',
  },
  selectClass: {
    '&:focus': {
      backgroundColor: 'inherit',
    },
    [theme.breakpoints.down('md')]: {
      paddingTop: 2.5,
      paddingBottom: 2.5,
    },
  },
}));

function SortInput({ orderBy, onChange = () => {}, options }) {
  const [expand, setExpand] = useState(false);
  const classes = useStyles({ expand });
  return (
    <TextField
      select
      classes={{ root: classes.root }}
      InputProps={{
        classes: {
          root: classes.inputClass,
        },
        disableUnderline: true,
        startAdornment: (
          <InputAdornment position="start">{t`Sort by`}</InputAdornment>
        ),
      }}
      SelectProps={{
        classes: {
          root: classes.selectClass,
        },
        onOpen: () => setExpand(true),
        onClose: () => setExpand(false),
      }}
      value={orderBy}
      onChange={e => onChange(e.target.value)}
    >
      {options.map(({ value, label }) => (
        <MenuItem key={value} value={value}>
          {label}
        </MenuItem>
      ))}
    </TextField>
  );
}

SortInput.displayName = 'SortInput';

export default SortInput;
