import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import {iptvAPI} from '../lib/api';
import {useAuth} from '../context/AuthContext';

const {width} = Dimensions.get('window');

const SetupScreen: React.FC = () => {
  const navigation = useNavigation();
  const {isAuthenticated} = useAuth();
  const [activeTab, setActiveTab] = useState<'m3u' | 'xtream' | 'paste'>('m3u');
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [providerName, setProviderName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [m3uUrl, setM3uUrl] = useState('');
  const [epgUrl, setEpgUrl] = useState('');
  const [m3uContent, setM3uContent] = useState('');

  // Smarters Theme
  const primaryColor = '#00A8B5'; // Teal
  const secondaryColor = '#004E92'; // Blue
  const darkBg = '#001518';

  useEffect(() => {
    if (!isAuthenticated) {
      navigation.navigate('Auth' as never);
      return;
    }
    loadCredentials();
  }, [isAuthenticated]);

  const loadCredentials = async () => {
    try {
      const result = await iptvAPI.getCredentials();
      if (result.success && result.data) {
        const creds = result.data;
        setProviderName(creds.provider_name || '');
        setServerUrl(creds.server_url || '');
        setM3uUrl(creds.m3u_url || '');
        setEpgUrl(creds.epg_url || '');
        // Password and username are sensitive, we don't pre-fill password usually
        setUsername(creds.username || '');
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload: any = {
        providerName: providerName.trim(),
        epgUrl: epgUrl.trim(),
      };

      if (activeTab === 'm3u') {
        if (!m3uUrl.trim()) throw new Error('M3U URL is required');
        payload.m3uUrl = m3uUrl.trim();
      } else if (activeTab === 'xtream') {
        if (!serverUrl.trim() || !username.trim() || !password.trim()) {
          throw new Error('All Xtream fields are required');
        }
        payload.serverUrl = serverUrl.trim();
        payload.username = username.trim();
        payload.password = password.trim();
      } else {
        if (!m3uContent.trim()) throw new Error('M3U Content is required');
        payload.m3uContent = m3uContent.trim();
      }

      const result = await iptvAPI.saveCredentials(payload);
      if (result.success) {
        Alert.alert('Success', 'IPTV Setup Completed!', [
          {text: 'Go to Dashboard', onPress: () => navigation.navigate('Dashboard' as never)},
        ]);
      } else {
        throw new Error(result.message || 'Failed to save');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (label: string, value: string, setter: (v: string) => void, placeholder: string, secure = false) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={setter}
        placeholder={placeholder}
        placeholderTextColor="#555"
        secureTextEntry={secure}
        autoCapitalize="none"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={darkBg} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Text style={styles.title}>SETUP YOUR PLAYLIST</Text>
          <Text style={styles.subtitle}>Enter your IPTV provider details below</Text>
        </View>

        <View style={styles.tabBar}>
          {[
            {id: 'm3u', label: 'M3U URL'},
            {id: 'xtream', label: 'XTREAM CODES'},
            {id: 'paste', label: 'PASTE M3U'},
          ].map(tab => (
            <TouchableOpacity 
              key={tab.id}
              onPress={() => setActiveTab(tab.id as any)}
              style={[styles.tab, activeTab === tab.id && {borderBottomColor: primaryColor}]}>
              <Text style={[styles.tabText, activeTab === tab.id && {color: primaryColor}]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.form}>
          {renderInput('PROVIDER NAME', providerName, setProviderName, 'e.g. My Premium IPTV')}
          
          {activeTab === 'm3u' && (
            <>
              {renderInput('M3U URL', m3uUrl, setM3uUrl, 'http://server.com/get.php?user=...')}
              {renderInput('EPG URL (OPTIONAL)', epgUrl, setEpgUrl, 'http://server.com/xmltv.php?user=...')}
            </>
          )}

          {activeTab === 'xtream' && (
            <>
              {renderInput('SERVER URL', serverUrl, setServerUrl, 'http://iptv-server.com:8080')}
              <View style={styles.row}>
                <View style={{flex: 1, marginRight: 10}}>
                  {renderInput('USERNAME', username, setUsername, 'Username')}
                </View>
                <View style={{flex: 1}}>
                  {renderInput('PASSWORD', password, setPassword, 'Password', true)}
                </View>
              </View>
              {renderInput('EPG URL (OPTIONAL)', epgUrl, setEpgUrl, 'Custom EPG Link')}
            </>
          )}

          {activeTab === 'paste' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>M3U CONTENT</Text>
              <TextInput
                style={[styles.input, {height: 150, textAlignVertical: 'top'}]}
                multiline
                value={m3uContent}
                onChangeText={setM3uContent}
                placeholder="#EXTM3U..."
                placeholderTextColor="#555"
              />
            </View>
          )}

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
            <LinearGradient colors={[primaryColor, secondaryColor]} style={styles.btnGradient}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>CONNECT NOW</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#001518'},
  scrollContent: {padding: 25},
  header: {marginBottom: 30, alignItems: 'center'},
  title: {color: '#fff', fontSize: 24, fontWeight: 'bold', letterSpacing: 1},
  subtitle: {color: '#00A8B5', fontSize: 14, marginTop: 5},
  tabBar: {flexDirection: 'row', marginBottom: 30, borderBottomWidth: 1, borderBottomColor: '#002E34'},
  tab: {flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent'},
  tabText: {color: '#666', fontSize: 12, fontWeight: 'bold'},
  form: {backgroundColor: '#001F24', padding: 20, borderRadius: 15, borderWidth: 1, borderColor: '#002E34'},
  inputGroup: {marginBottom: 20},
  label: {color: '#00A8B5', fontSize: 11, fontWeight: 'bold', marginBottom: 8},
  input: {backgroundColor: '#001518', color: '#fff', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#002E34'},
  row: {flexDirection: 'row'},
  saveBtn: {marginTop: 10, borderRadius: 10, overflow: 'hidden'},
  btnGradient: {padding: 18, alignItems: 'center'},
  btnText: {color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1},
  cancelBtn: {marginTop: 20, alignItems: 'center'},
  cancelText: {color: '#666', fontSize: 14},
});

export default SetupScreen;
