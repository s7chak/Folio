import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import Setting from './components/Setting';
import FolioView from './components/FolioView';
import FolioTrends from './components/FolioTrends';

const Stack = createStackNavigator();

const HomeScreen = ({isDarkMode}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString();
  const formattedDate = currentTime.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });0
  return (
    <View style={styles.container}>
      <View style={styles.heroContainer}>
        <Text style={[styles.header, isDarkMode && styles.headerDark]}>Folio</Text>
        <Text style={[styles.date, isDarkMode && styles.dateDark]}>{formattedDate}</Text>
        <Text style={[styles.clock, isDarkMode && styles.clockDark]}>{formattedTime}</Text>
      </View>
    </View>
  );
};
  
export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const toggleDarkMode = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };
  const [currentScreen, setCurrentScreen] = useState('Home');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Home':
        return <HomeScreen isDarkMode={ isDarkMode } />;
      case 'Folio':
        return <FolioView isDarkMode={ isDarkMode }/>;
      case 'Trends':
        return <FolioTrends isDarkMode={ isDarkMode }/>;
      case 'Setting':
        return <Setting isDarkMode={ isDarkMode }/>;
      default:
        return null;
    }
  };

  return (
    <View 
      style={[
        styles.container,
        isDarkMode ? styles.darkContainer : styles.lightContainer,
      ]}
    >
      {renderScreen()}
      <View style={isDarkMode ? darkStatusBarStyles : statusBarStyles}>
          <TouchableOpacity
            style={styles.icon}
            onPress={() => setCurrentScreen('Folio')}
          >
            <Ionicons name="analytics-outline" size={24} color={isDarkMode ? 'white' : 'black'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.icon}
            onPress={() => setCurrentScreen('Trends')}
          >
            <Ionicons name="newspaper-outline" size={24} color={isDarkMode ? 'white' : 'black'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.icon}
            onPress={() => setCurrentScreen('Setting')}
          >
            <Ionicons name="settings-outline" size={24} color={isDarkMode ? 'white' : 'black'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.icon}
            onPress={toggleDarkMode}
          >
            <Ionicons name={isDarkMode ? 'moon-outline' : 'sunny-outline'} size={24} color={isDarkMode ? 'white' : 'black'} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }


const styles = StyleSheet.create({
  heroContainer: {
    marginTop: '60%',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  lightContainer: {
    backgroundColor: 'rgb(245 ,240 ,248)',
  },
  darkContainer: {
    backgroundColor: 'rgb(20 , 40 , 70)',
  },
  header: {
    marginTop: 80,
    fontSize: 30,
    fontWeight: 'bold',
    color: 'black',
    paddingBottom: 10,
    marginBottom: 20,
  },
  headerDark: {
    color: 'white',
  },
  date: {
    fontSize: 22,
    color: 'black',
    marginBottom: 10,
  },
  dateDark: {
    color: 'white',
  },
  clock: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 20,
  },
  clockDark: {
    color: 'white',
  },
});

const statusBarStyles = {
  flexDirection: 'row',
  justifyContent: 'space-around',
  alignItems: 'center',
  width: '100%',
  position: 'absolute',
  bottom: 0,
  paddingTop: 20,
  paddingBottom: 40,
  backgroundColor: 'rgb(240 ,240 ,255)',
};

const darkStatusBarStyles = {
  ...statusBarStyles,
  // backgroundColor: '#345',
  backgroundColor: 'rgb(20 , 40 , 70)',
};
