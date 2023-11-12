import React, {useEffect, useState} from 'react';
import { View, Text, StyleSheet, ScrollView, Button, TextInput, Modal, FlatList, TouchableOpacity, TouchableWithoutFeedback, Platform } from 'react-native';
import { getFirestore, collection, addDoc, query, where, getDocs, deleteDoc  } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import RNPickerSelect from 'react-native-picker-select';
import { Ionicons } from '@expo/vector-icons';



function Setting({isDarkMode}) {
  const [savedToDoList, setSavedToDoList] = useState([]);
  const [code, setCode] = useState('');
  const [showTable, setShowTable] = useState(false);
  const [selectedToDoList, setSelectedToDoList] = useState(null);

  const [selectedDate, setSelectedDate] = useState(null);
  const [daysCount, setDaysCount] = useState(null);
  const [countButtonClicked, setCountButtonClicked] = useState(false);
  const [word, setWord] = useState("since");
  const [titleWord, setTitleWord] = useState("Days");
  const [isSaved, setIsSaved] = useState(false);
  const [name, setName] = useState("");
  const [savedStocks, setSavedStocks] = useState([]);
  const [isCode, setIsCode] = useState(false);
  
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
      
      let orderedList = sortList(gotStocks);
      setSavedStocks(orderedList);
      setItemExpanded('');
      handleCodeSave();
    } catch (error) {
      console.error("Error getting stocks: ", error);
    }
  };

  useEffect(() => {
    const retrieveData = async () => {
      try {
        const savedLists = await AsyncStorage.getItem('todolist');
        if (savedLists) {
          const parsedLists = JSON.parse(savedLists);
          setSavedToDoList(parsedLists);
        }
      } catch (error) {
        console.error('Error retrieving saved lists: ', error);
      }
    };
  
    retrieveData();
  }, []);

  const handleCodeSaveClick = async () => {
    try {
      let codeWord = code.toLowerCase();
      const q = query(collection(db, 'Folios'), where('Code', '==', codeWord));
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      console.log('Deleted existing documents with code: ', codeWord);
      console.log('Saving stocks:', savedStocks);
      const dataToSave = {
        Code: codeWord,
        Stocks: JSON.stringify(savedStocks),
      };
  
      const savePromises = await addDoc(collection(db, 'Folios'), dataToSave);
  
      alert('Stocks saved.');
    } catch (error) {
      console.error('Error saving stocks: ', error);
    }
  };


  const handleCodeSave = async () => {
    try {
      await AsyncStorage.setItem('code', code);
      console.log('Code saved to AsyncStorage');
    } catch (error) {
      console.error('Error saving code: ', error);
    }
  };

  const loadLists = async () => {
    try {
      const savedLists = await AsyncStorage.getItem('savedToDoLists');
      if (savedLists) {
        const parsedLists = JSON.parse(savedLists);
        setSavedToDoList(parsedLists);
        console.log('Lists loaded from AsyncStorage');
      }
    } catch (error) {
      console.error('Error loading lists: ', error);
    }
  };
  
  const handleItemLongPress = (name) => {
    setShowContextMenu(true);
    setSelectedListItem(name);
  };
  

  const toggleTable = async (listName) => {
    setShowContextMenu(false);
    let selectedList = savedToDoList.find((list) => list.name === listName);
    selectedList = reorderList(selectedList);
    
    setSelectedToDoList(selectedList);
    setShowTable(true);
  };

  const handleDeleteStock = () => {
    const updatedLists = savedStocks.filter(list => list.name !== selectedListItem);
    console.log("Deleting Stock:", selectedListItem);
    setSavedStocks(updatedLists);
    setShowContextMenu(false);
  };
  
  const renderItem = ({ item }) => {
    const isExpanded = item.name == itemExpanded;
    return (
      <View style={styles.selectedListItem}>
        <TouchableWithoutFeedback onPress={() => toggleExpansion(item)} onLongPress={() => handleItemLongPress(item.name)}>
          <View style={styles.checkboxContainer}>
            <Text style={styles.selectedListItemText}>
              {item.name}   :   {item.total}
            </Text>
            {showContextMenu && item.name == selectedListItem && (
              <View style={styles.contextMenu}>
                <TouchableOpacity onPress={handleDeleteStock} style={styles.contextMenuItem}>
                  <Ionicons name="trash-outline" size={24} color="black" style={styles.contextMenuItemText} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>

        {isExpanded && (
          <View style={styles.expandedContainer}>
            <View style={styles.inputRow}>
              <Text style={styles.label}>Ticker:</Text>
              <TextInput
                placeholder="Ticker"
                value={item.name || ''}
                onChangeText={(text) => setStockName(text)}
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.label}>Qty:</Text>
              <TextInput
                placeholder="Qty"
                value={item.quantity || ''}
                onChangeText={(qty) => setStockQuantity(qty)}
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.label}>Cost:</Text>
              <TextInput
                placeholder="Cost"
                value={item.cost || ''}
                onChangeText={(cost) => setStockCost(cost)}
              />
            </View>
          </View>
        )}
      </View>
    );
  };
  
  const [itemExpanded, setItemExpanded] = useState(''); // State to track expansion
  const [showDatePicker, setShowDatePicker] = useState(false); // State to track expansion

  const toggleExpansion = (item) => {
    if (item.name!=itemExpanded) {
      setItemExpanded(item.name);
    }
    else {
      setItemExpanded("");
    }
    
    setShowDatePicker(false);
  };
  const toggleDatePicker = () => {
    setShowDatePicker((showDatePicker) => !showDatePicker);
  };

  const handleNotesChange = (item, text) => {
    const updatedItems = selectedToDoList.items.map((listItem) => {
      if (listItem.name === item.name) {
        return {
          ...listItem,
          notes: text,
        };
      }
      return listItem;
    });
    setSelectedToDoList({
      ...selectedToDoList,
      items: updatedItems,
    });
    const selectedIndex = savedToDoList.findIndex(
      (list) => list.name === selectedToDoList.name
    );
    const updatedSavedToDoList = [...savedToDoList];
    updatedSavedToDoList[selectedIndex] = selectedToDoList;
    setSavedToDoList(updatedSavedToDoList);
  };

  const [taskDate, setTaskDate] = useState(null); // State to track expansion
  const handleDeadlineChange = (event, value) => {
    console.log(value);
    setTaskDate(value);
    const updatedItems = selectedToDoList.items.map((listItem) => {
      if (listItem.name === itemExpanded) {
        return {
          ...listItem,
          deadline: value,
        };
      }
      return listItem;
    });
    setSelectedToDoList({
      ...selectedToDoList,
      items: updatedItems,
    });
    const selectedIndex = savedToDoList.findIndex(
      (list) => list.name === selectedToDoList.name
    );
    const updatedSavedToDoList = [...savedToDoList];
    updatedSavedToDoList[selectedIndex] = selectedToDoList;
    setSavedToDoList(updatedSavedToDoList);
  };


  const [showModal, setShowModal] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [newListMade, setNewListMade] = useState(false);
  const [stockName, setStockName] = useState('');
  const [stockCost, setStockCost] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');

  const handleAddStock = () => {
    if (!stockName) {
      return;
    }
    let updatedItems;
    updatedItems = [...savedStocks, { name: stockName, cost: stockCost, quantity: stockQuantity }];
    let sortedList = sortList(updatedItems);
    setSavedStocks(sortedList);
    setStockName('');
    setStockCost('');
    setStockQuantity('');

    setShowModal(false);
  };
  

  const [creatingNewList, setCreatingNewList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newList, setNewList] = useState({'name':'','items':[]});
  const handleAddList = () => {
    setSelectedToDoList(null);
    setCreatingNewList(!creatingNewList);
    setNewList({'name':'', 'items' : []});
    if (!creatingNewList) {
      setShowTable(false);
    } else {
      setNewListName('');
    }
  };
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedListItem, setSelectedListItem] = useState(null);


  return (
    <ScrollView 
      style={{ flex: 1 }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}>
      <View style={styles.plusHeaderRow}>
      <Text style={[styles.header, isDarkMode && styles.headerDark]}>Setting</Text>
        <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonLabel}>+</Text>
        </TouchableOpacity>
      </View>
      <Modal visible={showModal} animationType="slide">
        <View style={styles.modalContainer}>
          <TextInput
            placeholder="Ticker"
            value={stockName}
            onChangeText={(text) => setStockName(text.toUpperCase())}
            style={styles.finput}
          />
          <TextInput
            placeholder="Quantity"
            value={stockQuantity}
            onChangeText={setStockQuantity}
            style={styles.finput}
          />
          <TextInput
            placeholder="Cost Price"
            value={stockCost}
            onChangeText={setStockCost}
            style={styles.finput}
          />
            <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleAddStock}
              activeOpacity={0.8}
            >
            <Text style={styles.buttonText}>Add</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setShowModal(false)}
              activeOpacity={0.8}
            >
            <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {savedStocks.length>0 && (
        <View style={styles.selectedListContainer}>
            <FlatList
                  data={savedStocks}
                  renderItem={renderItem}
                  keyExtractor={(item, index) => index.toString()}
                />
        </View>
      )}

      <View style={styles.inputContainer}>
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
    marginRight: 30,
  },
  headerDark: {
    color: 'white',
  },
  plusHeaderRow: {
    flexDirection: 'row',
    width: '80%',
    justifyContent: 'center',
    // alignItems: 'right',
    marginBottom: 20,
    marginRight: 20
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 10,
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

  selectedListHeader: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  selectedListHeaderDark: {
    color: 'white',
  },

  selectedListItem: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    width: 200,
    height: 'auto',
    fontWeight: 'bold',
    backgroundColor: 'rgb(240 ,240 ,255)',
    justifyContent: 'center'
  },

  selectedListItemText: {
    fontSize: 17,
    fontWeight: 'bold',
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
    top: 10
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
    width: 70,
    paddingLeft: 10,
    paddingRight: 10,
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
    backgroundColor: 'rgb(100 ,80 ,120, 0.8)',
  },

  finput: {
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 10,
    padding: 10,
    width: '80%',
    marginVertical: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    marginRight: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  einput: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 10,
    width: '80%',
    marginVertical: 10,
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
  deadlineText: {
    marginTop: 5,
    marginBottom: 5,
  },

  contextMenu: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'white',
    borderRadius: 5,
    elevation: 5,
  },
  contextMenuItem: {
    padding: 2,
  },
  contextMenuItemText: {
    fontSize: 15,
    color: 'black',
  },

});
const pickerSelectStyles = {
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    color: 'black',
    paddingRight: 30, // to ensure the text is never behind the icon
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: 'purple',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30, // to ensure the text is never behind the icon
  },
};

export default Setting;

function sortList(selectedList: any) {
  selectedList.forEach((stock) => {
    stock.total = parseFloat((parseFloat(stock.quantity) * parseFloat(stock.cost)).toFixed(2));
  });
  selectedList.sort((stockA, stockB) => stockB.total - stockA.total);
  console.log(selectedList);
  return selectedList;
}

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