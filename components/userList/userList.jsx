import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  Paper,
  ListItemIcon, 
}
from '@material-ui/core';
import {Link} from "react-router-dom";
import './userList.css';
import axios from 'axios';
import PersonIcon from '@material-ui/icons/Person';


/**
 * Define UserList, a React componment of CS142 project #5
 */
class UserList extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      showContent : "",
      alldone: false
    };
  }

  componentDidUpdate = () =>{
    if (!this.state.alldone){
    axios.get("/user/list")
    .then((response) => {
      var allUsers = [];
      var allUserId = [];
      let display = [];
      var allIds = [];
      var userInformation = response.data;
  
      for (let i =0; i < userInformation.length; i++){
        allUsers[i] = userInformation[i].first_name + " " + userInformation[i].last_name;
        allUserId[i] = "/users/" + userInformation[i]._id;
        allIds[i] = userInformation[i]._id;
      }
      for (let i =0; i < allUsers.length; i++){
        display[i] = <Paper key = {allUsers[i]} className = "list-button">
                      <ListItem button key = {allUsers[i]}>
                        <ListItemIcon key = {allUsers[i]}>
                          <PersonIcon />
                        </ListItemIcon>
                        <Link className = "list-link" to = {allUserId[i]} key = {allUsers[i]} onClick = {this.props.handler}> 
                          <ListItemText className = "link" primary= {allUsers[i]}></ListItemText>
                        </Link>
                      </ListItem>
                      </Paper>;
                  
      }
      this.setState({
        showContent : display,
        alldone: true
      })     
    })
    .catch(function (err){
      console.log(err);
    })
    }
    
  }


  render() {
    return (
      <div className = "user-list-area">
        <List >
          {this.state.showContent}
        </List>
      </div>
    );
  }
}

export default UserList;
