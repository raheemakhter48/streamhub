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
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
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
  const [epgUrl, setEpgUrl] = useState('');
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
        setEpgUrl(creds.epgUrl || '');
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
        credentials.epgUrl = epgUrl.trim();
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Setup IPTV</Text>
          <Text style={styles.headerSubtitle}>
            Configure your playlist to start streaming live channels
          </Text>
        </View>

        <View style={styles.tabContainer}>
          {[
            {id: 'm3u', label: 'M3U URL'},
            {id: 'credentials', label: 'Xtream'},
            {id: 'paste', label: 'Paste'},
          ].map((tab: any) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}>
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Provider Name (Optional)</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="e.g. My Premium IPTV"
                placeholderTextColor="#666"
                value={providerName}
                onChangeText={setProviderName}
              />
            </View>
          </View>

          {activeTab === 'm3u' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>M3U Playlist URL</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="https://server.com/playlist.m3u"
                    placeholderTextColor="#666"
                    value={m3uUrl}
                    onChangeText={setM3uUrl}
                    keyboardType="url"
                    autoCapitalize="none"
                  />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>EPG XMLTV URL (Optional)</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="https://server.com/epg.xml.gz"
                    placeholderTextColor="#666"
                    value={epgUrl}
                    onChangeText={setEpgUrl}
                    keyboardType="url"
                    autoCapitalize="none"
                  />
                </View>
              </View>
            </>
          )}

          {activeTab === 'credentials' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Server URL</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="http://iptv-provider.com:8080"
                    placeholderTextColor="#666"
                    value={serverUrl}
                    onChangeText={setServerUrl}
                    keyboardType="url"
                    autoCapitalize="none"
                  />
                </View>
              </View>
              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, {flex: 1, marginRight: 8}]}>
                  <Text style={styles.label}>Username</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="User"
                      placeholderTextColor="#666"
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                    />
                  </View>
                </View>
                <View style={[styles.inputGroup, {flex: 1, marginLeft: 8}]}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Pass"
                      placeholderTextColor="#666"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      autoCapitalize="none"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>EPG XMLTV URL (Optional)</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="https://server.com/epg.xml.gz"
                    placeholderTextColor="#666"
                    value={epgUrl}
                    onChangeText={setEpgUrl}
                    keyboardType="url"
                    autoCapitalize="none"
                  />
                </View>
              </View>
            </>
          )}

          {activeTab === 'paste' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>M3U Content</Text>
              <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="#EXTM3U\n#EXTINF:-1,Channel Name\nhttp://server.com/stream.ts"
                  placeholderTextColor="#444"
                  value={m3uContent}
                  onChangeText={setM3uContent}
                  multiline
                  numberOfLines={8}
                  textAlignVertical="top"
                />
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.saveButtonContainer}
            onPress={handleSave}
            disabled={loading}>
            <LinearGradient
              colors={['#3b82f6', '#2563eb']}
              style={[styles.saveButton, loading && styles.buttonDisabled]}>
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.saveButtonText}>Save & Sync Channels</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  headerSection: {
    marginTop: 10,
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 8,
    lineHeight: 22,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 6,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: '#2a2a2a',
    elevation: 2,
  },
  tabText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#3b82f6',
  },
  formCard: {
    backgroundColor: '#111111',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#aaa',
    marginBottom: 10,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputWrapper: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    overflow: 'hidden',
  },
  textAreaWrapper: {
    height: 180,
  },
  input: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  textArea: {
    height: '100%',
  },
  saveButtonContainer: {
    marginTop: 10,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
  },
  saveButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  backButton: {
    marginTop: 25,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default SetupScreen;

export default SetupScreen;

