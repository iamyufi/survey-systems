import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Survey from './components/Survey';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import './App.css';

function App() {
  return (
    <div className="App">
      <Router>
        <Switch>
          <Route path="/admin/login" component={AdminLogin} />
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/" component={Survey} />
        </Switch>
      </Router>
    </div>
  );
}

export default App;