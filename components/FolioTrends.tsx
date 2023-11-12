import React, {useEffect, useState} from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Image, TextInput, Modal, FlatList, TouchableOpacity, TouchableWithoutFeedback, Platform, ActivityIndicator } from 'react-native';
import { getFirestore, collection, addDoc, query, where, getDocs, deleteDoc  } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { PieChart, LineChart, BarChart } from 'react-native-chart-kit';
import tinycolor from 'tinycolor2';


const envInfo = {
  'local': {'api': "http://localhost:<BACKENDPORT>"},
  'prod': {'api': "<API_URL>"}
};
const activeEnv = 'prod';

function process(list) {
  list.forEach(s => {
    s.cost = parseFloat(s.cost);
    s.quantity = parseFloat(s.quantity);
    s.total = s.cost * s.quantity;
  });
  return list;
}

function FolioTrends({isDarkMode}) {
  const [savedToDoList, setSavedToDoList] = useState([]);
  const [code, setCode] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [selectedToDoList, setSelectedToDoList] = useState(null);
  const [savedStocks, setSavedStocks] = useState([]);
  const [processList, setProcessList] = useState([]);
  const [headlineMessage, setMessage] = useState(null);
  const [sentScores, setSentScores] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stockSheet, setStockSheet] = useState(null);
  const [historyFetched, setHistoryFetched] = useState(false);
  const [historyMetricSheet, setHistoryMetricSheet] = useState(null);
  const [isMetricLoading, setIsMetricLoading] = useState(false);
  const [stockExpandable, setStockExpandable] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [corrModal, setCorrModalVisible] = useState(false);
  const [anomModal, setAnomModalVisible] = useState(false);
  const [corrImage, setCorrImage] = useState(null);
  const [selectedStock, setSelectedStock] = useState('');
  const [anomImage, setAnomImage] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [selectedStocks, setSelectedStocks] = useState([]);


  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
  };
  
  const doHeadlineAnalysis = async (stocks, code) => {
    healthCheck();
    try {
      const response = await axios.get(envInfo[activeEnv]['api']+'/headlines', {
          params: { 'stocks[]': JSON.stringify(stocks), code: code },
      });
      const data = response.data;
      if (data.hasOwnProperty('Sentiment')) {
        console.log(Object.keys(data['Sentiment']));
        setSentScores(data['Sentiment']);
      }
      setMessage(data['message']);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error('Error fetching headline analysis:', error, envInfo[activeEnv]['api']);
      throw error;
    }
  }

  // useEffect(() => {
  //   if (savedStocks.length>0){
  //     doHeadlineAnalysis(savedStocks, code);
  //   }
  // }, []);
  
  useEffect(() => {
    if (selectedStock!=''){
      selectedStockList(selectedStock);
    }
  }, [selectedStock]);

  const selectedStockList = (selectedStock) => {
    const index = selectedStocks.indexOf(selectedStock);
    if (index === -1) {
      setSelectedStocks([...selectedStocks, selectedStock]);
    } else {
      const updatedStocks = selectedStocks.filter((stock) => stock !== selectedStock);
      setSelectedStocks(updatedStocks);
    }
  };

  const getStockSheet = async (gainSorted) => {
    if (gainSorted!=''){
      try {
        const response = await axios.get(envInfo[activeEnv]['api']+'/stocksheet', {
          params: { code: code, gainSorted: gainSorted },
        });
        const data = response.data;
        setStockSheet(data);
        // alert("Sorted by "+ gainSorted);
      } catch (error) {
        console.error('Error fetching stock sheet:', error);
        throw error;
      }
    }
  }

  const handleCodeGetClick = async () => {
    try {
      let codeWord = code.toLowerCase();
      const q = query(collection(db, "Folios"), where("Code", "==", codeWord));
      const querySnapshot = await getDocs(q);
      const gotStocks = [];
      querySnapshot.forEach((doc) => {
        const dateData = doc.data();
        let stocks = JSON.parse(dateData['Stocks']);
        stocks.forEach(data => {
          gotStocks.push({
            name: data.name,
            quantity: data.quantity,
            cost: data.cost,
          });
        });
      });
      doHeadlineAnalysis(gotStocks, code);
      setSavedStocks(gotStocks);
      setProcessList(process(gotStocks));
      setSelectedStocks([])
    } catch (error) {
      console.error("Error getting stocks: ", error);
    }
  };

  useEffect(() => {
    const retrieveData = async () => {
      try {
        const savedCode = await AsyncStorage.getItem('code');
        if (savedCode) {
          setCode(savedCode);
        }
      } catch (error) {
        console.error('Error retrieving saved code: ', error);
      }
    };
  
    retrieveData();
  }, []);



  const handleCodeSaveClick = async () => {
    try {
      let codeWord = code.toLowerCase();
      const q = query(collection(db, 'Lists'), where('Code', '==', codeWord));
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      console.log('Deleted existing documents with code: ', codeWord);
      console.log('Saving lists:', savedToDoList);
      if (newListMade) {
        savedToDoList.push(newList);
      }
      const dataToSave = savedToDoList.map((list) => ({
        Code: codeWord,
        ListName: list.name,
        Items: JSON.stringify(list.items),
      }));
  
      const savePromises = dataToSave.map((data) => addDoc(collection(db, 'Lists'), data));
      await Promise.all(savePromises);
  
      alert('Lists saved.');
    } catch (error) {
      console.error('Error saving lists: ', error);
    }
  };


  const [newListMade, setNewListMade] = useState(false);


  const [newList, setNewList] = useState({'name':'','items':[]});
  const [isGainSorted, setIsGainSorted] = useState('');
  const sessionCheck = async () => {
    try {
      const response = await axios.get(envInfo[activeEnv]['api']+'/session_check');
      const data = response.data;
      console.log(data['message']);
    } catch (error) {
      console.error('Error contacting python backend:', error);
      throw error;
    }
  }

  const healthCheck = async () => {
    try {
      const response = await axios.get(envInfo[activeEnv]['api']+'/health');
      const data = response.data;
      console.log(data['message']);
      return data;
    } catch (error) {
      console.error('Error contacting python backend:', error);
      alert('No backend for you.')
      throw error;
    }
  }

  useEffect(() => {
    getStockSheet(isGainSorted);
    setStockExpandable(true);
  }, [isGainSorted]);



  const StockPieChartModal = ({ isVisible, chartData }) => {
    const customColors = chartData.map(item => item.color);
    const randomRed = Math.floor(Math.random() * 256);
    const randomGreen = Math.floor(Math.random() * 256);
    const randomBlue = Math.floor(Math.random() * 256);
    const getColor = () => `rgba(${randomRed}, ${randomGreen}, ${randomBlue}, 1)`;
    const data = {
      labels: chartData.map(item => item.name),
      datasets: [
        {
          data: chartData.map(item => item.data),
        },
      ],
    };
    return (
      <Modal
        visible={isVisible}
        animationType='slide'
      >
        <ScrollView style={{ flex: 1}}
          contentContainerStyle={[styles.modalContainer, isDarkMode && styles.modalContainerDark]}
          showsVerticalScrollIndicator={false}
          pinchGestureEnabled={true}
          maximumZoomScale={3}>

          {isGainSorted=='percentage' && (
            <View style={{ flex: 1, alignItems: 'center', width: '100%', marginTop: 100}}>
              <PieChart
                  data={chartData}
                  width={Dimensions.get('window').width}
                  height={Dimensions.get('window').width}
                  chartConfig={{
                    backgroundGradientFrom: '#1E2923',
                    backgroundGradientTo: '#08130D',
                    color: (opacity = 1) => `rgba(220, 200, 250, ${opacity})`,
                  }}
                  accessor={"percentage"}
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                  hasLegend={false}
                  style={{ alignSelf: 'center', marginTop: 20, marginBottom: 50}}
                />
                { chartData.map((item, index) => (
                  <View
                    key={index}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 5,
                      marginLeft: 20,
                      width: 100,
                    }}
                  >
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      backgroundColor: 'transparent',
                      marginRight: 5,
                    }}
                  />
                  <Text>
                    {item.name} : {item.percentage}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {isGainSorted.includes('change') && (
              <View style={{ flex: 1, alignItems: 'center', width: '100%', padding: 10 }}>
                <Text style={{ flex: 1, alignSelf: 'center', width: '100%', marginTop: 20, padding: 10, fontSize: 25, fontWeight: 'bold' }}>Plot {isGainSorted}</Text>
                <BarChart
                  data={data}
                  width={Dimensions.get('window').width-10}
                  height={Dimensions.get('window').width}
                  chartConfig={{
                    backgroundGradientFrom: '#efefef',
                    backgroundGradientTo: '#cdbded',
                    color: (opacity = 1) => `rgba(20, 20, 20, ${opacity})`,
                    paddingTop: 10,
                    // paddingRight: 100,
                    fillShadowGradient: `rgba(100, 80, 200, 0.8)`,
                    fillShadowGradientOpacity: 0.7,
                    decimalPlaces: 0,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, 1)`,
                  }}
                  fromZero={true}
                  showValuesOnTopOfBars={true}
                  verticalLabelRotation={-70}
                  absolute
                  style={{ alignSelf: 'center', marginTop: 10, marginBottom: 10 }}
                />
              </View>
          )}          
          <TouchableOpacity
                style={styles.button}
                onPress={() => setIsModalVisible(false)}
                activeOpacity={0.8}
              >
              <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    );
  };


  const StockPieChart = ({ data }) => {
    const numberOfShades = data.length;
    const colors = [];
    let baseColor;

    for (let i = 0; i < numberOfShades; i++) {
      if (i % 5 === 0) {
        baseColor = tinycolor.random();
      }
      const saturation = 100 - (i%5 * 10);
      const shadeColor = baseColor.clone().saturate(saturation).toHexString();
      // const validColorRegex = /^#[0-9A-Fa-f]{6}$/;
      // console.log(validColorRegex.test(shadeColor), shadeColor);
      colors.push(shadeColor);
    }
    const chartData = data.map((stock, index) => ({
      name: stock.name,
      percentage: stock.percentage,
      data: isGainSorted=='changepct'?stock.changepct:stock.change,
      change: stock.change,
      changepct: stock.changepct,
      color: colors[index]
    }));
    return (
      <View>
        <StockPieChartModal
          isVisible={isModalVisible}
          chartData={chartData}
        />
      </View>
    );
  };

  const [startDate, setStartDate] = useState(new Date());
  useEffect(() => {
    AsyncStorage.setItem('startDate', startDate.toString());
  }, [startDate]);

  const handleFetchHistory = async () => {

    try {
      const response = await axios.get(envInfo[activeEnv]['api']+'/fetchHistory', {
          params: { code: code, startDate: startDate },
      });
      const data = response.data;
      setHistoryFetched(true);
      alert("Fetched history: "+data.message);
    } catch (error) {
      console.error('Error fetching history sheet:', error);
      throw error;
    }
  };

  const handleHistorymetrics = async () => {
    try {
      setIsMetricLoading(true);
      const response = await axios.get(envInfo[activeEnv]['api']+'/fetchHistoryMetrics', {
          params: { code: code, startDate: startDate},
      });
      let data = response.data;
      setHistoryMetricSheet(data);
      setIsMetricLoading(false);
      alert("Fetching historical metrics data complete.")
    } catch (error) {
      setIsMetricLoading(false);
      console.error('Error fetching historical fact sheet:', error);
      throw error;
    }
  };

  
  const handleShowHistory = async () => {
    if (!!startDate) {
      try {
        const response = await axios.get(envInfo[activeEnv]['api']+'/showHistory', {
            params: { code: code, startDate: startDate },
        });
        const data = response.data;
        if (Object.keys(data).includes('history')) {
          setHistoryData(data['history']);
          setShowHistory(true);
        }
        alert("Cannot show history at the moment.")
      } catch (error) {
        console.error('Error fetching historical data:', error);
        throw error;
      }
    }
  };

  const FolioVsSnPLineModal = ({ isVisible }) => {
    let chartData;
    let stockFilter = ['Folio','S&P'];
    let chartConfig = {};
    if (historyData.length > 0){
      const labels = historyData.map(item => {
        const date = new Date(item.Date);
        const year = date.getFullYear().toString().slice(-2);
        const month = ('0' + (date.getMonth() + 1)).slice(-2);
        return `${month}-${year}`;
      });
      const datasets = stockFilter.map(stockName => {
        const randomRed = Math.floor(Math.random() * 220);
        const randomGreen = Math.floor(Math.random() * 100);
        const randomBlue = Math.floor(Math.random() * 256);
        const getColor = (opacity = 1) => `rgba(${randomRed}, ${randomGreen}, ${randomBlue}, 1)`;
        return {
          data: historyData.map(item => item[stockName]),
          name: stockName,
          color: getColor,
        };
      });
      
      const visibleLabels = labels.filter((_, index) => index % 30 === 0);
      
      chartData = {
        labels: visibleLabels,
        datasets,
        legend: stockFilter,
      };
      chartConfig = {
        backgroundGradientFrom: '#efefff',
        backgroundGradientTo: '#ededed',
        color: (opacity = 1) => `rgba(25, 25, 25, 0)`,
        labelColor: (opacity = 1) => `rgba(25, 25, 25, 1)`,
        style: {
          borderRadius: 20,
        },
        showLegend: true,
        legendLabels: stockFilter,
        propsForDots: {
          r: "1",
        },
      };
      
    }
    
    
    return (
      <Modal visible={isVisible}
        animationType='slide'>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.modalContainer, isDarkMode && styles.modalContainerDark]}
          showsVerticalScrollIndicator={false}
          pinchGestureEnabled={true}
          maximumZoomScale={3}
        >
          <LineChart
            data={chartData}
            width={Dimensions.get('window').width - 5}
            height={Dimensions.get('window').width - 30}
            chartConfig={chartConfig}
            verticalLabelRotation={-70}
            style={{ alignSelf: 'center', marginTop: 20, marginBottom: 50 }}
          />
          <TouchableOpacity
                style={styles.button}
                onPress={() => setShowHistory(false)}
                activeOpacity={0.8}
              >
            <Text style={{ marginTop: 10 }}>Close</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    );
  };

  const handleCorrelation = async () => {
    if (!!startDate) {
      try {
        const response = await axios.get(envInfo[activeEnv]['api']+'/fetchCorrelation', {
            params: { code: code, startDate: startDate },
        });
        const data = response.data;
        alert("Got historical correlation.")
        setCorrModalVisible(true);
        setCorrImage(data['corr']);
      } catch (error) {
        console.error('Error fetching historical correlation:', error);
        throw error;
      }
    }
  };

  const CorrelationPlotModal = ({ isVisible, imageBytes }) => {
    return (
      <Modal visible={isVisible}
        animationType='slide'>
        <ScrollView style={{ flex: 1}}
          contentContainerStyle={[styles.modalContainer, isDarkMode && styles.modalContainerDark]}
          showsVerticalScrollIndicator={false}
          pinchGestureEnabled={true}
          maximumZoomScale={3}>
          <Image
            source={{ uri: `data:image/png;base64,${imageBytes}` }}
            style={{ width: Dimensions.get('window').width, height: 500 }}
            resizeMode="contain"
          />
          <TouchableOpacity
                style={styles.button}
                onPress={() => setCorrModalVisible(false)}
                activeOpacity={0.8}
              >
            <Text style={{ marginTop: 10 }}>Close</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    );
  };

  const handleAnomaly = async () => {
    if (!!startDate) {
      try {
        let selectedStocksString = selectedStocks.join(',');
        const response = await axios.get(envInfo[activeEnv]['api']+'/fetchAnomalies', {
            params: { code: code, startDate: startDate, symbols: selectedStocksString },
        });
        const data = response.data;
        alert("Anomaly: " + data['message']);
        setAnomModalVisible(true);
        setAnomImage(data['anom']);
      } catch (error) {
        console.error('Error fetching historical anomalies:', error);
        throw error;
      }
    }
  };

  const AnomalyPlotModal = ({ isVisible, imageBytes }) => {
    return (
      <Modal visible={isVisible}
        animationType='slide'>
        <ScrollView style={{ flex: 1}}
          contentContainerStyle={[styles.modalContainer, isDarkMode && styles.modalContainerDark]}
          showsVerticalScrollIndicator={false}
          pinchGestureEnabled={true}
          maximumZoomScale={3}>
          <Image
            source={{ uri: `data:image/png;base64,${imageBytes}` }}
            style={{ width: Dimensions.get('window').width, height: 500 }}
            resizeMode="contain"
          />
          <TouchableOpacity
                style={styles.button}
                onPress={() => setAnomModalVisible(false)}
                activeOpacity={0.8}
              >
            <Text style={{ marginTop: 10 }}>Close</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    );
  };

  const toggleExpandStocks = () => {
    setIsGainSorted(isGainSorted==''?'percentage':isGainSorted);
    setStockExpandable(!stockExpandable);
  };
  

  return (
    <ScrollView 
      style={{ flex: 1 }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}>
      <View style={styles.plusHeaderRow}>
        <Text style={[styles.header, isDarkMode && styles.headerDark]}>Trends</Text>
        <Text style={[styles.todayDate, isDarkMode && styles.todayDateDark]}>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</Text>
      </View>
      {savedStocks.length>0 && isLoading && (
        <ActivityIndicator size="large" color="#dcddfd" />
      )}
      {savedStocks.length>0 && !sentScores && !isLoading && (
          <View style = {styles.textLabel}><Text> {headlineMessage} </Text></View>
      )}
      {savedStocks.length>0 && !!sentScores && !isLoading && (
        <View style={styles.selectedListContainer}>
          <Text>{headlineMessage}</Text>
          <View style={styles.factListItem}>
            <Text style={styles.selectedListHeader}>Sentiment</Text>
            {Object.keys(sentScores).map((key) => (
              <View key={key} style={styles.row}>
                <Text style={styles.keyText}>{key}:</Text>
                <Text style={styles.valueText}>{sentScores[key]}</Text>
              </View>
            ))}
            </View>
        </View>
      )}
      {savedStocks.length>0 && historyFetched && isMetricLoading && (
        <ActivityIndicator size="large" color="#dcddfd" />
      )}

      {stockExpandable && !!stockSheet && (
        <View style={styles.selectedListContainer}>
          <TouchableOpacity
              style={styles.button}
              onPress={toggleModal}
              activeOpacity={0.8}
            >
            <Text style={styles.buttonText}>Plot</Text>
          </TouchableOpacity>
          <StockPieChart data={stockSheet} />
        </View>
      )}
        
      
      
      <View style={styles.inputContainer}>
        {savedStocks.length>0 && (
          <View style={styles.selectedListContainer}>
            <View style={styles.selectedListItem}>
              <Text style={styles.selectedListHeader}>Stocks</Text>
              <View style={styles.row}>
                <TouchableOpacity onPress={() => setIsGainSorted('change')}>
                  <Text>change</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsGainSorted('changepct')}>
                  <Text>changepct</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsGainSorted('percentage')}>
                  <Text>percent</Text>
                </TouchableOpacity>
                {/* <TouchableOpacity onPress={() => setIsGainSorted('pe')}>
                  <Text>pe</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsGainSorted('volatility')}>
                  <Text>volatility</Text>
                </TouchableOpacity> */}
              </View>
              <Text style={styles.selectedListItemText} onPress={() => toggleExpandStocks()}>{savedStocks.map(stock => stock.name).join(', ')}</Text>
            </View>


            {stockExpandable && !!stockSheet && (
              <>
              {selectedStocks.length>0 &&(
                <View style = {styles.stockSelection}>
                  <Text>{selectedStocks.join(', ')}</Text>
                </View>
              )}
              <FlatList
              data={stockSheet}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <View style={styles.selectedListItem}>
                  <TouchableWithoutFeedback onPress={() => setSelectedStock(item.name)}>
                    <View>
                      <Text>Name: {item.name}</Text>
                      <Text>%Portfolio: {String(item.percentage)}</Text>
                      <Text>Change: {String(item.change)}</Text>
                      <Text>Ret%: {String(item.changepct)}</Text>
                      <Text>Cost: {String(item.total_cost)}</Text>
                      <Text>Worth: {String(item.total_worth)}</Text>
                    </View>
                  </TouchableWithoutFeedback>
                  <View>
                    {/* <Text>PE Ratio: {String(item.peRatio)}</Text>
                    <Text>Volatility: {String(item.volatility)}</Text> */}
                  </View>
                </View>
                )}
              />
              </>
            )}
          </View>
        )}
        
        <TextInput
          placeholder="Code Word"
          value={code}
          onChangeText={setCode}
          style={styles.input}
        />

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleCodeGetClick}
            activeOpacity={0.8}
          >
          <Text style={styles.buttonText}>Get</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={handleCodeSaveClick}
            activeOpacity={0.8}
          >
          <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
      
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: '20%',
    marginTop: '5%',
    height: 'auto',
    width: '100%',
    paddingBottom: '30%',
  },
  header: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#333',
    paddingBottom: 20,
    width: '100%',
  },
  headerDark: {
    color: 'white',
  },

  todayDate: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#334',
    paddingBottom: 20,
    width: '100%',
    alignSelf: 'center'
  },
  todayDateDark: {
    color: '#889',
  },
  plusHeaderRow: {
    flexDirection: 'column',
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  listContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    padding: 15,
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: 'gray',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
    backgroundColor: 'rgb(250 , 240 ,255)',
  },
  listName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  listItems: {
    elevation: 0,
    marginTop: 5,
    color: '#333',
  },
  inputContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: '100%',
    bottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    backgroundColor: 'rgb(255 , 252 ,255)',
    borderRadius: 8,
    padding: 10,
    width: 200,
    marginVertical: 10,
  },

  selectedListContainer: {
    // borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 10,
    shadowColor: 'gray',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
    marginTop: 20,
    padding: 10,
    // backgroundColor: 'white',
    width: '90%',
    alignSelf: 'center',
    marginBottom: 20,
    // backgroundColor: 'rgba(245, 240, 255, 0.8)'
  },

  startLabel: {
    fontSize: 17,
    fontWeight: 'bold',
    marginRight: 0
  },
  startLabelDark: {
    color: 'white',
  },

  scrollView: {
    flexDirection: 'row',
  },
  metricContainer: {
    width: '45%',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderColor: 'gray',
    borderRadius: 10,
    backgroundColor: 'rgb(240 ,240 ,255)',
    marginHorizontal: 15,
  },

  selectedListHeader: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 10
  },

  selectedListHeaderDark: {
    color: 'white',
  },

  selectedListItem: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 5,
    width: 300,
    fontWeight: 'bold',
    backgroundColor: 'rgb(240 ,240 ,255)',
  },
  stockSelection: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 5,
    width: 300,
    fontWeight: 'bold',
    backgroundColor: 'rgb(240 ,240 ,255)',
  },
  column: {
    // flex: 1,
    color: 'black'
  },
  selectedListItemText: {
    fontSize: 17,
    paddingVertical: 10,
  },
  factListItem: {
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 10,
    width: '100%',
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: 'rgb(240 ,240 ,255)',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  keyText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 5,
  },
  valueText: {
    fontSize: 18,
    textAlign: 'left',
  },

  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgb(240 ,240 ,255, 0.7)',
  },

  checkboxIcon: {
    padding: 2,
    marginRight: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 10,
    top: 10,
  },
  button: {
    backgroundColor: 'rgb(250 , 250 ,255)',
    borderRadius: 10,
    elevation: 5,
    shadowColor: 'gray',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginVertical: 10,
    marginHorizontal: 10,
    alignItems: 'center',
    width: 80,
    paddingLeft: 10,
    paddingRight: 10,
    marginTop: 10,
  },
  buttonText: {
    fontSize: 18,
    color: 'black',
  },
  addButtonContainer: {
    alignItems: 'flex-end', // Align the button to the right
    paddingRight: 20, // Adjust the padding to match the desired spacing
  },
  addButton: {
    backgroundColor: 'rgb(252 ,250 ,255)',
    borderRadius: 10, // Make it a circle by setting borderRadius to half of the width/height
    elevation: 5,
    shadowColor: 'gray',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    padding: 5,
    width: 38, // Set width and height to the same value for a circular button
    height: 38,
    justifyContent: 'center', // Center the content horizontally and vertically
    alignItems: 'center',
    marginLeft: 10,
  },
  addButtonLabel: {
    fontSize: 18,
    color: 'black',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgb(250 ,240 ,255, 0.8)',
  },
  modalContainerDark: {
    backgroundColor: 'rgb(100 ,80 ,12, 0.8)',
  },
  dateInputContainer: {
    flex: 1,
    // borderWidth: 1,
    borderRadius: 10,
    elevation: 5,
    marginTop: 20,
    padding: 10,
    width: 350,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: 'rgba(245, 240, 255, 0.8)'
  },
  dinput: {
    // borderWidth: 1,
    // borderRadius: 10,
    borderColor: 'gray',
    padding: 10,
    alignSelf: 'center',
    // backgroundColor: 'rgba(245, 240, 255, 0.9)'
  },
  dinputDark: {
    fontWeight: 'bold'
  },

  expandedContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'rgb(248 ,248 ,252)',
    borderRadius: 5,
  },

  deadlineLabel: {
    fontWeight: 'bold',
    marginTop: 5,
    marginBottom: 5,
  },
  textLabel: {
    marginTop: 5,
    marginBottom: 5,
    backgroundColor: 'white',
    fontWeight: 'bold'
  },

  contextMenu: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 5,
    elevation: 5,
    padding: 5,
  },
  contextMenuItem: {
    padding: 5,
  },
  contextMenuItemText: {
    fontSize: 16,
    color: 'black',
  },

  tooltipContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
    zIndex: 1, 
    top: 10,
    left: 10,
  },
  tooltipText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

});

export default FolioTrends;


function reorderList(selectedList: any) {
  const selectedItems = [];
  const nonSelectedItems = [];

  selectedList.items.forEach((item) => {
    if (item.selected) {
      selectedItems.push(item);
    } else {
      nonSelectedItems.push(item);
    }
  });

  const sortedItems = nonSelectedItems.concat(selectedItems);
  selectedList = {
    ...selectedList,
    items: sortedItems,
  };
  return selectedList;
}

const firebaseConfig = {
  apiKey: "<FirebaseParameter>",
  authDomain: "<FirebaseParameter>",
  projectId: "<FirebaseParameter>",
  storageBucket: "<FirebaseParameter>",
  messagingSenderId: "<FirebaseParameter>",
  appId: "<FirebaseParameter>",
  measurementId: "<FirebaseParameter>"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
