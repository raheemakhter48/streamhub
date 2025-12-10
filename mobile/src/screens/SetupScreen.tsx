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
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {iptvAPI} from '../lib/api';
import {useAuth} from '../context/AuthContext';

const SetupScreen: React.FC = () => {
  const navigation = useNavigation();
  const {isAuthenticated} = useAuth();
  const [activeTab, setActiveTab] = useState<'m3u' | 'credentials' | 'paste'>('m3u');
  const [loading, setLoading] = useState(false);
  const [providerName, setProviderName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [m3uUrl, setM3uUrl] = useState('');
  const [m3uContent, setM3uContent] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigation.navigate('Auth' as never);
      return;
    }
    loadCredentials();
  }, [isAuthenticated]);

  const loadCredentials = async () => {
    try {
      const data = await iptvAPI.getCredentials();
      if (data.success && data.data) {
        const creds = data.data;
        setProviderName(creds.providerName || '');
        setUsername(creds.username || '');
        setServerUrl(creds.serverUrl || '');
        setM3uUrl(creds.m3uUrl || '');
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
    }
  };

  const generateM3UUrl = (server: string, user: string, pass: string): string => {
    let cleanUrl = server.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `http://${cleanUrl}`;
    }
    try {
      const url = new URL(cleanUrl);
      url.pathname = '/get.php';
      url.search = '';
      url.searchParams.set('username', user);
      url.searchParams.set('password', pass);
      url.searchParams.set('type', 'm3u_plus');
      return url.toString();
    } catch {
      return `${cleanUrl}/get.php?username=${user}&password=${pass}&type=m3u_plus`;
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let credentials: any = {providerName};

      if (activeTab === 'm3u') {
        if (!m3uUrl.trim()) {
          Alert.alert('Error', 'Please enter M3U URL');
          setLoading(false);
          return;
        }
        credentials.m3uUrl = m3uUrl.trim();
      } else if (activeTab === 'credentials') {
        if (!serverUrl.trim() || !username.trim() || !password.trim()) {
          Alert.alert('Error', 'Please fill in all fields');
          setLoading(false);
          return;
        }
        credentials.serverUrl = serverUrl.trim();
        credentials.username = username.trim();
        credentials.password = password.trim();
        credentials.m3uUrl = generateM3UUrl(serverUrl, username, password);
      } else if (activeTab === 'paste') {
        if (!m3uContent.trim()) {
          Alert.alert('Error', 'Please paste M3U content');
          setLoading(false);
          return;
        }
        credentials.m3uContent = m3uContent.trim();
      }

      const result = await iptvAPI.saveCredentials(credentials);
      if (result.success) {
        Alert.alert('Success', 'IPTV credentials saved!', [
          {text: 'OK', onPress: () => navigation.navigate('Dashboard' as never)},
        ]);
      } else {
        Alert.alert('Error', result.message || 'Failed to save credentials');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'm3u' && styles.tabActive]}
          onPress={() => setActiveTab('m3u')}>
          <Text style={[styles.tabText, activeTab === 'm3u' && styles.tabTextActive]}>
            M3U URL
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'credentials' && styles.tabActive]}
          onPress={() => setActiveTab('credentials')}>
          <Text
            style={[styles.tabText, activeTab === 'credentials' && styles.tabTextActive]}>
            Username/Password
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'paste' && styles.tabActive]}
          onPress={() => setActiveTab('paste')}>
          <Text style={[styles.tabText, activeTab === 'paste' && styles.tabTextActive]}>
            Paste M3U
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Provider Name (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="My IPTV Provider"
            placeholderTextColor="#666"
            value={providerName}
            onChangeText={setProviderName}
          />
        </View>

        {activeTab === 'm3u' && (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>M3U URL</Text>
            <TextInput
              style={styles.input}
              placeholder="https://example.com/playlist.m3u"
              placeholderTextColor="#666"
              value={m3uUrl}
              onChangeText={setM3uUrl}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>
        )}

        {activeTab === 'credentials' && (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Server URL</Text>
              <TextInput
                style={styles.input}
                placeholder="http://server.com:8080"
                placeholderTextColor="#666"
                value={serverUrl}
                onChangeText={setServerUrl}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Your username"
                placeholderTextColor="#666"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Your password"
                placeholderTextColor="#666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
          </>
        )}

        {activeTab === 'paste' && (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>M3U Content</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Paste your M3U playlist content here..."
              placeholderTextColor="#666"
              value={m3uContent}
              onChangeText={setM3uContent}
              multiline
              numberOfLines={10}
              textAlignVertical="top"
            />
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Save Credentials</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    padding: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#3b82f6',
  },
  tabText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#ffffff',
  },
  textArea: {
    height: 200,
    paddingTop: 16,
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SetupScreen;

