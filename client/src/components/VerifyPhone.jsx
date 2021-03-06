// import axios from 'axios';
// import { Link } from 'react-router-dom';
// import { ValidatorForm } from 'react-form-validator-core';
// import { TextValidator } from 'react-material-ui-form-validator';

import React from 'react';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';
import { ValidatorForm } from 'react-form-validator-core';
import { TextValidator } from 'react-material-ui-form-validator';
import Snackbar from 'material-ui/Snackbar';
import TextField from 'material-ui/TextField';

export default class VerifyPhone extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      formData: {
        phone: '1234567890'
      },
      open: false,
      validNumber: false,
      reminderOpen: !this.props.verifiedUser
    }
  }

  componentDidMount() {
    this.testNumber();
  }

  notNow() {
    this.setState({reminderOpen: false});
    this.handleClose();
  }

  handleInputChanges(event) {
    const { formData } = this.state;
    formData[event.target.name] = event.target.value;
    this.setState({ formData });
    this.testNumber();
  }

  testNumber() {
    if ((parseInt(this.state.formData.phone).toString() === this.state.formData.phone) && (this.state.formData.phone.toString().length === 10 || this.state.formData.phone.toString().length === 11) ) {
      this.setState({validNumber: true});
    }
    else {
      this.setState({ validNumber: false });
    }
  }

  handleOpen() {
    this.setState({ open: true });
  };

  handleClose() {
    this.setState({ open: false });
  };

  handleSubmit() {
    console.log('submitting!');
  }

  render() {
    const { formData } = this.state;
    const actions = [
      <FlatButton
        label="Cancel"
        primary={true}
        onClick={this.handleClose.bind(this)}
      />,
      <FlatButton
        label="Submit"
        primary={true}
        keyboardFocused={true}
        disabled={!this.state.validNumber}
        onClick={this.handleSubmit.bind(this)}
      />,
      <FlatButton
        label="Not Now"
        primary={true}
        onClick={this.notNow.bind(this)}
      />
    ];
    return (
      <div>
        <Snackbar
          open={this.state.reminderOpen}
          message='Please verify your phone number'
          action="verify"
          autoHideDuration={3000}
          onActionClick={this.handleOpen.bind(this)}
          onRequestClose={()=>{console.log('requesting close', this)}}
        />
        <Dialog
          title="Enter your phone number"
          actions={actions}
          modal={false}
          open={this.state.open}
          onRequestClose={this.handleClose.bind(this)}
        >
          <ValidatorForm
            ref="form"
            onSubmit={this.handleClose.bind(this)}
            onError={errors => console.log(errors)}
          >
            <TextValidator
              floatingLabelText="Phone Number"
              onChange={this.handleInputChanges.bind(this)}
              name="phone"
              value={formData.phone}
              validators={['required', 'isNumber', 'minStringLength:10', 'maxStringLength:11']}
              errorMessages={['this field is required', 'not a valid phone number', 'example: 7895551234', 'must not excede 11 characters']}
            />
          </ValidatorForm>
        </Dialog>
      </div>
    );
  }
}