import React, { useState, useEffect } from 'react';
import { Feather as Icon } from '@expo/vector-icons';
import { 
  View, 
  ImageBackground, 
  Text, 
  Image, 
  StyleSheet 
} from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import RNPickerSelect from 'react-native-picker-select';
import axios from 'axios';

interface State {
  id: number;
  name: string;
}

interface City {
  id: number;
  name: string;
}

interface IBGEUFResponse {
  id: number;
  sigla: string;
}

interface IBGECityResponse {
  id: number;
  nome: string;
}

interface Item {
  label: string;
  key: number;
  value: number;
}

const Home = () => {
  const navigation = useNavigation();

  const placeholderCity = {label: 'Selecione uma cidade...', key: 0, value: 0 };
  const placeholderState = {label: 'Selecione um estado...', key: 0, value: 0 };

  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  const [selectedState, setSelectedState] = useState<State>({} as State);
  const [selectedCity, setSelectedCity] = useState<City>({} as City);

  const [selectedCityItem, setSelectedCityItem] = useState({} as Item);

  useEffect(() => {
    axios.get<IBGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then(response => {
        setStates(response.data.map(uf => ({
          id: uf.id,
          name: uf.sigla
        })));
    });
  }, []);

  useEffect(() => {
    if (!selectedState) {
      return;
    }
    axios.get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedState.id}/municipios?orderBy=nome`)
      .then(response => {
        setCities(response.data.map(city => ({
          id: city.id,
          name: city.nome
        })));
    });
  }, [selectedState]);

  function handleSelectState(value: number) {
    const findState = states.find(state => state.id === value);
    if (findState) {
      setSelectedState(findState);
      setSelectedCityItem(placeholderCity);
    }
  }

  function handleSelectCity(value: number) {
    const findCity = cities.find(city => city.id === value);
    if (findCity) {
      setSelectedCity(findCity);
      setSelectedCityItem({
        label: findCity.name, 
        key: findCity.id, 
        value: findCity.id, 
      });
    }
  }

  function handleNavigateToPoints() {
    navigation.navigate('Points', {
      city: selectedCity.name,
      uf: selectedState.name 
    });
  }

  return (
    <ImageBackground 
      source={require('../../assets/home-background.png')} 
      style={styles.container}
      imageStyle={{ width: 274, height: 368 }}
    >
      <View style={styles.main}>
        <Image source={require('../../assets/logo.png')} />
        <Text style={styles.title}>Seu marketplace de coleta de resíduos.</Text> 
        <Text style={styles.description}>Ajudamos pessoas a encontrarem pontos de coleta de forma eficiente.</Text> 
      </View>

      <View style={styles.footer}>
        <RNPickerSelect 
          style={pickerSelectStyles}
          placeholder={placeholderState}
          useNativeAndroidPickerStyle={false}
          onValueChange={handleSelectState}
          items={states.map(state => (
            { label: state.name, key: state.id, value: state.id }
          ))}
          Icon={() => {
            return (
              <Icon name='chevron-down' color='#A0A0B2' size={20} />
            )
          }}
        />

        <RNPickerSelect
          style={pickerSelectStyles}
          placeholder={placeholderCity}
          value={selectedCityItem}
          useNativeAndroidPickerStyle={false}
          onValueChange={handleSelectCity}
          itemKey={selectedCityItem.key}
          items={cities.map(city => (
            { label: city.name, key: city.id, value: city.id }
          ))}
          Icon={() => {
            return (
              <Icon name='chevron-down' color='#A0A0B2' size={20} />
            )
          }}
        />

        <RectButton style={styles.button} onPress={handleNavigateToPoints}>
          <View style={styles.buttonIcon}>
            <Text>
              <Icon name='arrow-right' color='#fff' size={24} />
            </Text>
          </View>
          <Text style={styles.buttonText}>
            Entrar
          </Text>
        </RectButton>
      </View>
    </ImageBackground>)
  ;
};

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    height: 60,
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginBottom: 8,
    paddingHorizontal: 24,
    fontSize: 16,
    color: '#A0A0B2',
  },
  inputAndroid: {
    height: 60,
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginBottom: 8,
    paddingHorizontal: 24,
    fontSize: 16,
    color: '#A0A0B2',
  },
  iconContainer: {
    top: 20,
    right: 20,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 32,
  },

  main: {
    flex: 1,
    justifyContent: 'center',
  },

  title: {
    color: '#322153',
    fontSize: 32,
    fontFamily: 'Ubuntu_700Bold',
    maxWidth: 260,
    marginTop: 64,
  },

  description: {
    color: '#6C6C80',
    fontSize: 16,
    marginTop: 16,
    fontFamily: 'Roboto_400Regular',
    maxWidth: 260,
    lineHeight: 24,
  },

  footer: {},

  select: {},

  input: {
    height: 60,
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginBottom: 8,
    paddingHorizontal: 24,
    fontSize: 16,
  },

  button: {
    backgroundColor: '#34CB79',
    height: 60,
    flexDirection: 'row',
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    marginTop: 8,
  },

  buttonIcon: {
    height: 60,
    width: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center'
  },

  buttonText: {
    flex: 1,
    justifyContent: 'center',
    textAlign: 'center',
    color: '#FFF',
    fontFamily: 'Roboto_500Medium',
    fontSize: 16,
  }
});

export default Home;
