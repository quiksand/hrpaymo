// ---------- Packages ---------- //
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import $ from 'jquery';
import axios from 'axios';

// ---------- Material UI ---------- //
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

// ---------- Componenets ---------- //
import LoggedOutHome from './components/LoggedOutHome.jsx';
import Home from './components/Home.jsx';
import Login from './components/Login.jsx';
import SignUp from './components/SignUp.jsx';
import Profile from './components/Profile.jsx';
import Navbar from './components/Navbar.jsx';



const muiTheme = getMuiTheme({
  palette: {
    primary1Color: '#3D95CE',
  },
});

const FEED_ENDPOINTS = {
  'globalFeed': '/feed/global',
  'userFeed': '/feed/user'
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      isLoggedIn: false,
      globalFeed: {},
      userFeed: {},
      balance: null,
      userInfo: {},
      usernames: []
    }
  }

  componentDidMount() {
  }

  loadUserData(userId) {
    this.getUserInfo(userId)
    this.getBalance(userId);
    this.getFeed('globalFeed');
    this.getFeed('userFeed', userId);
    this.getUsernames(userId);
  }

  refreshUserData(userId) {
    this.getBalance(userId);
    this.getFeed('globalFeed', this.state.globalFeed.newestTransactionId || null);
    this.getFeed('userFeed', userId, this.state.userFeed.newestTransactionId || null);
    this.getUsernames(userId)
  }

  getUsernames(userId) {
    axios('/usernames', { params: { userId: userId }})
    .then(response => {
      this.setState({
        usernames: response.data.usernames
      });
    })
    .catch(err => {
      console.error(err);
    })
  }

  getFeed(feedType, userId = null, sinceId) {
    let endpoint = FEED_ENDPOINTS[feedType];
    if (feedType === 'userFeed') {
      endpoint = `${endpoint}/${userId}`;
    }
    let params = {
      sinceId: sinceId
    }

    axios(endpoint, {params: params})
      .then((response) => {
        this.prependNewTransactions(feedType, response.data);
      })
      .catch((err) => {
        console.error(err);
      });
  }

  mergeFeeds(newerFeed, olderFeed) {
    // If there is already existing data in the feed, combine them, prepending the 
    // more recent transactions to the top
    let combinedItems = (newerFeed.items || []).concat(olderFeed.items || []);

    // Update feed meta-data to accurately reflect combined data
    let combinedFeedObject = {
      items: combinedItems,
      count: (newerFeed.count || 0) + (olderFeed.count || 0),
      nextPageTransactionId: olderFeed.nextPageTransactionId || null,
      newestTransactionId: newerFeed.newestTransactionId || null
    }

    return combinedFeedObject;
  }

  prependNewTransactions(feedType, transactionSummary) {
    // If no results return, do nothing
    if (!transactionSummary || transactionSummary.count === 0) {
      return;
    }

    // If feed was empty, set the returned transactions as the feed
    let isFeedEmpty = !this.state[feedType].count || this.state[feedType].count === 0;

    let newFeedObject = isFeedEmpty
      ? transactionSummary
      : this.mergeFeeds(transactionSummary, this.state[feedType]);

    this.setState({
      [feedType]: newFeedObject
    })
  }

  loadMoreFeed(feedType, userId) {
    let endpoint = FEED_ENDPOINTS[feedType];

    if (feedType === 'userFeed') {
      endpoint = `${endpoint}/${userId}`;
    } 

    // Send along the next valid ID you'd like returned back
    // from the database
    let params = {
      beforeId: this.state[feedType].nextPageTransactionId
    }

    axios(endpoint, {params: params})
      .then((response) => {

        // Confirm there additional items to load
        if (response.data && response.data.count > 0) {
          let combinedItems = this.mergeFeeds(this.state[feedType], response.data);

          this.setState({
            [feedType]: combinedItems
          })
        }
      })
      .catch((err) => {
        console.error(err);
      }); 
  }

  getBalance(userId) {
    axios('/balance', {params: {userId: userId}})
      .then((response) => {
        this.setState({
          balance: response.data.amount
        });
      })
      .catch((err) =>{
        console.error(err);
      });
  }

  getUserInfo(userId) {
    axios('/profile', {params: {userId: userId}})
      .then((response) => {
        this.setState({
          userInfo: response.data
        });
      })
      .catch((err) =>{
        console.error(err);
      });
  }

  logUserIn(userId) {
    this.setState({
      isLoggedIn: true
    })
    this.loadUserData(userId);
  }

  logUserOut() {
    this.setState({
      isLoggedIn: false,
      globalFeed: {},
      userFeed: {},
      balance: null,
      userInfo: {}
    })
  }

  requireAuth(nextState, replace) {
    if (!this.state.isLoggedIn) {
      replace({
        pathname: '/login'
      })
    }
  }

  render () {
    const HomeWithProps = (props) => {
      return (
        <div>
          {!this.state.isLoggedIn 
            ? <LoggedOutHome 
                isLoggedIn={this.state.isLoggedIn} 
                logUserOut={this.logUserOut.bind(this)}
                {...props}
              />
            : <Home
                refreshUserData={this.refreshUserData.bind(this)}
                isLoggedIn={this.state.isLoggedIn} 
                logUserOut={this.logUserOut.bind(this)}
                userFeed={this.state.userFeed} 
                loadMoreFeed={this.loadMoreFeed.bind(this)}
                globalFeed={this.state.globalFeed}
                userInfo={this.state.userInfo}
                balance={this.state.balance}
                usernames={this.state.usernames}
                {...props}
              />
          }
        </div>
      )
    }

    return (
      <MuiThemeProvider muiTheme={muiTheme}>
        <BrowserRouter>
          <Switch>
            <Route 
              exact path="/signup" 
              render={routeProps => <SignUp {...routeProps} logUserIn={this.logUserIn.bind(this)} />} 
            />
            <Route 
              exact path="/login" 
              render={routeProps => <Login {...routeProps} logUserIn={this.logUserIn.bind(this)} />} 
            />
            <Route 
              path="/view?=(:id)" 
              render={HomeWithProps}
              onEnter={ this.requireAuth }
            />
            <Route 
              path="/:username" 
              render={routeProps => 
                <Profile {...routeProps} 
                  refreshUserData={this.refreshUserData.bind(this)}
                  isLoggedIn={this.state.isLoggedIn} 
                  logUserOut={this.logUserOut.bind(this)}
                  userInfo={this.state.userInfo} />
              }
              onEnter={ this.requireAuth }
            />
            <Route 
              path="/" 
              render={HomeWithProps} 
            />
          </Switch>
        </BrowserRouter>
      </MuiThemeProvider>
    )
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
