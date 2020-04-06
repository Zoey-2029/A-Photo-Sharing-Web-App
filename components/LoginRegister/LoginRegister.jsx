import React from 'react';
import "./LoginRegister.css";
import axios from 'axios';
import TextField from '@material-ui/core/TextField';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';


class LoginRegister extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            hasAccount : true
        }
    }

    hasAccount = () => {
        return this.state.hasAccount;
    }

    register = (event) => {
        this.setState({
            hasAccount : false
        })
    }

    handleLoginSubmit = (event) => {
        event.preventDefault(); 
        axios.post("/admin/login", {
            login_name: document.getElementById("loginUsername").value,
            password : document.getElementById("loginPassword").value
        })
        .then((response) =>{
            window.location.replace("photo-share.html#/users/" + response.data._id);
            this.props.changeLoginstatus();
        })
        .catch(function(err){
            alert(err.request.response);
        })
    }

    handleRegister = (event) =>{
        
        event.preventDefault();

        if (document.getElementById("register_password").value !== document.getElementById("register_comfirm_password").value){
            alert("Different password");
            return;
        }
        
        axios.post("/user", {
            login_name: document.getElementById("register_username").value,
            password :document.getElementById("register_password").value,
            first_name: document.getElementById("register_first_name").value,
            last_name: document.getElementById("register_last_name").value, 
            location: document.getElementById("register_location").value,
            occupation: document.getElementById("register_occupation").value,
            description: document.getElementById("register_description").value
        })
        .then((response) =>{
            alert(response.data);
            this.setState({hasAccount: true});
        })
        .catch ( err =>{
            alert(err.request.response);
        })
    }
    back = () =>{
        this.setState({hasAccount: true});
    }

    render (){
        return(
            <div>
                

                {
                this.hasAccount() ?
                    <div className = "login-register-area">
                        <div className = "hint-area">
                            Sign In
                        </div>
                        <TextField required className = "input-area" id = "loginUsername" label = "Username" type = "text" size = "small"/><br />
                        <TextField required className = "input-area" id = "loginPassword" label = "Password" type = "password"  size = "small"/><br />
                        <button className = "register-login-button" variant="contained" onClick = {event => this.handleLoginSubmit(event)}> 
                            SIGN IN
                        </button><br />
                        <div className ="no-account">
                            Have not account yet?
                        </div>
                        <div className = "sign-up-button" disableRipple = "true" onClick = {event => this.register(event)}>
                            Sign Up
                        </div>
                    </div>
                :
                    <div className = "login-register-area">
                        <div className = "hint-area">
                            <button className = "back-button"onClick = {this.back}>
                                <ArrowBackIosIcon />
                             </button>
                            Sign Up
                        </div>
                        <TextField required className = "input-area" id = "register_username" label = "Username" type = "text" size = "small" />
                        <TextField required className = "input-area" id = "register_password" label = "Password" type = "password" size = "small" /><br />
                        <TextField required className = "input-area" id = "register_comfirm_password" label = "Comfirm Password" type = "password" size = "small" />
                        <TextField required className = "input-area" id = "register_first_name" label = "First Name" type = "text" size = "small" /><br />
                        <TextField required className = "input-area" id = "register_last_name" label = "Last Name" type = "text" size = "small" />
                        <TextField className = "input-area" id = "register_location" label = "Location" type = "text" size = "small" /><br />
                        <TextField className = "input-area" id = "register_occupation" label = "Occupation" type = "text" size = "small" />
                        <TextField className = "input-area" id = "register_description" label = "Description" type = "text" size = "small" /><br />
                        <button className = "register-login-button" variant="contained" onClick = {event => this.handleRegister(event)}>
                            Sign Up
                        </button>
                    </div>  
                }
            </div>
            
        );
    }
}

export default LoginRegister;