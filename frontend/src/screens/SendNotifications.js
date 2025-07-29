import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { API_BASE_URL } from '../config/api';

const SendNotifications = ({ navigation }) => {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [loadingTargets, setLoadingTargets] = useState(true);
  
  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState('ALL_PARENTS');
  const [selectedTargets, setSelectedTargets] = useState([]);
  const [priority, setPriority] = useState('NORMAL');
  const [sendWhatsApp, setSendWhatsApp] = useState(false);
  
  // Target data
  const [classes, setClasses] = useState([]);
  const [parents, setParents] = useState([]);
  const [targetSummary, setTargetSummary] = useState({});
  
  // UI state
  const [showTargetSelector, setShowTargetSelector] = useState(false);

  useEffect(() => {
    fetchNotificationTargets();
  }, []);

  const fetchNotificationTargets = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/targets`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes);
        setParents(data.parents);
        setTargetSummary(data.summary);
      } else {
        throw new Error('Failed to fetch targets');
      }
    } catch (error) {
      console.error('Error fetching notification targets:', error);
      Alert.alert('Error', 'Failed to load notification targets');
    } finally {
      setLoadingTargets(false);
    }
  };

  const handleSendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Error', 'Please fill in both title and message');
      return;
    }

    if ((targetType === 'SPECIFIC' || targetType === 'CLASS_PARENTS') && selectedTargets.length === 0) {
      Alert.alert('Error', 'Please select targets for your notification');
      return;
    }

    setLoading(true);

    try {
      const requestBody = {
        title: title.trim(),
        message: message.trim(),
        targetType,
        priority,
        sendWhatsApp
      };

      if (targetType === 'SPECIFIC' || targetType === 'CLASS_PARENTS') {
        requestBody.targetIds = selectedTargets;
      }

      const response = await fetch(`${API_BASE_URL}/api/notifications/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success',
          `Notification sent to ${data.notificationsSent} recipients${
            data.whatsappResult ? 
            `\nWhatsApp: ${data.whatsappResult.sent} sent, ${data.whatsappResult.failed} failed` : 
            ''
          }`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset form
                setTitle('');
                setMessage('');
                setTargetType('ALL_PARENTS');
                setSelectedTargets([]);
                setPriority('NORMAL');
                setSendWhatsApp(false);
              }
            }
          ]
        );
      } else {
        throw new Error(data.error || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      Alert.alert('Error', error.message || 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const getTargetSelectorData = () => {
    switch (targetType) {
      case 'CLASS_PARENTS':
        return classes.map(cls => ({
          id: cls.id,
          label: cls.displayName,
          subtitle: `${cls.studentCount} students`
        }));
      case 'SPECIFIC':
        return parents.map(parent => ({
          id: parent.id,
          label: parent.name,
          subtitle: `${parent.email}${parent.whatsappOptIn ? ' (WhatsApp ✓)' : ''}`
        }));
      default:
        return [];
    }
  };

  const toggleTargetSelection = (targetId) => {
    setSelectedTargets(prev => 
      prev.includes(targetId) 
        ? prev.filter(id => id !== targetId)
        : [...prev, targetId]
    );
  };

  const getSelectedTargetCount = () => {
    switch (targetType) {
      case 'ALL_PARENTS':
        return targetSummary.totalParents || 0;
      case 'CLASS_PARENTS':
        return classes
          .filter(cls => selectedTargets.includes(cls.id))
          .reduce((total, cls) => total + cls.studentCount, 0);
      case 'SPECIFIC':
        return selectedTargets.length;
      default:
        return 0;
    }
  };

  const styles = getStyles(theme);

  if (loadingTargets) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={[styles.backText, { color: theme.surface }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.surface }]}>Send Notifications</Text>
      </View>

      <View style={styles.form}>
        {/* Title Input */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Title *</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.surface, 
              borderColor: theme.border,
              color: theme.text
            }]}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter notification title"
            placeholderTextColor={theme.textSecondary}
            maxLength={100}
          />
        </View>

        {/* Message Input */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Message *</Text>
          <TextInput
            style={[styles.textArea, { 
              backgroundColor: theme.surface, 
              borderColor: theme.border,
              color: theme.text
            }]}
            value={message}
            onChangeText={setMessage}
            placeholder="Enter your message here..."
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={[styles.charCount, { color: theme.textSecondary }]}>
            {message.length}/500 characters
          </Text>
        </View>

        {/* Target Type */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Send To</Text>
          <View style={[styles.pickerContainer, { 
            backgroundColor: theme.surface, 
            borderColor: theme.border 
          }]}>
            <Picker
              selectedValue={targetType}
              onValueChange={(value) => {
                setTargetType(value);
                setSelectedTargets([]);
              }}
              style={{ color: theme.text }}
            >
              <Picker.Item label="All Parents" value="ALL_PARENTS" />
              <Picker.Item label="Specific Classes" value="CLASS_PARENTS" />
              <Picker.Item label="Specific Parents" value="SPECIFIC" />
            </Picker>
          </View>
        </View>

        {/* Target Selection */}
        {(targetType === 'CLASS_PARENTS' || targetType === 'SPECIFIC') && (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>
              Select {targetType === 'CLASS_PARENTS' ? 'Classes' : 'Parents'}
            </Text>
            <TouchableOpacity
              style={[styles.selectorButton, { 
                backgroundColor: theme.surface, 
                borderColor: theme.border 
              }]}
              onPress={() => setShowTargetSelector(true)}
            >
              <Text style={[styles.selectorText, { color: theme.text }]}>
                {selectedTargets.length > 0 
                  ? `${selectedTargets.length} selected`
                  : `Select ${targetType === 'CLASS_PARENTS' ? 'classes' : 'parents'}`
                }
              </Text>
              <Text style={[styles.arrow, { color: theme.textSecondary }]}>›</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Priority */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Priority</Text>
          <View style={[styles.pickerContainer, { 
            backgroundColor: theme.surface, 
            borderColor: theme.border 
          }]}>
            <Picker
              selectedValue={priority}
              onValueChange={setPriority}
              style={{ color: theme.text }}
            >
              <Picker.Item label="Normal" value="NORMAL" />
              <Picker.Item label="High" value="HIGH" />
              <Picker.Item label="Low" value="LOW" />
            </Picker>
          </View>
        </View>

        {/* WhatsApp Option */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setSendWhatsApp(!sendWhatsApp)}
        >
          <View style={[styles.checkbox, { 
            backgroundColor: sendWhatsApp ? theme.primary : theme.surface,
            borderColor: theme.border
          }]}>
            {sendWhatsApp && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={[styles.checkboxLabel, { color: theme.text }]}>
            Also send via WhatsApp
          </Text>
        </TouchableOpacity>

        {/* Summary */}
        <View style={[styles.summaryCard, { 
          backgroundColor: theme.surface, 
          borderColor: theme.border 
        }]}>
          <Text style={[styles.summaryTitle, { color: theme.text }]}>Summary</Text>
          <Text style={[styles.summaryText, { color: theme.textSecondary }]}>
            Recipients: {getSelectedTargetCount()} parents
          </Text>
          {sendWhatsApp && (
            <Text style={[styles.summaryText, { color: theme.textSecondary }]}>
              WhatsApp enabled: {targetSummary.totalWhatsAppOptIns} opted in
            </Text>
          )}
        </View>

        {/* Send Button */}
        <TouchableOpacity
          style={[styles.sendButton, { 
            backgroundColor: theme.primary,
            opacity: loading ? 0.7 : 1
          }]}
          onPress={handleSendNotification}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.surface} />
          ) : (
            <Text style={[styles.sendButtonText, { color: theme.surface }]}>
              Send Notification
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Target Selector Modal */}
      <Modal
        visible={showTargetSelector}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.primary }]}>
            <TouchableOpacity onPress={() => setShowTargetSelector(false)}>
              <Text style={[styles.modalCloseText, { color: theme.surface }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.surface }]}>
              Select {targetType === 'CLASS_PARENTS' ? 'Classes' : 'Parents'}
            </Text>
            <TouchableOpacity onPress={() => setShowTargetSelector(false)}>
              <Text style={[styles.modalDoneText, { color: theme.surface }]}>Done</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {getTargetSelectorData().map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.selectorItem, { 
                  backgroundColor: theme.surface, 
                  borderColor: theme.border 
                }]}
                onPress={() => toggleTargetSelection(item.id)}
              >
                <View style={styles.selectorItemContent}>
                  <Text style={[styles.selectorItemLabel, { color: theme.text }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.selectorItemSubtitle, { color: theme.textSecondary }]}>
                    {item.subtitle}
                  </Text>
                </View>
                <View style={[styles.checkbox, { 
                  backgroundColor: selectedTargets.includes(item.id) ? theme.primary : theme.surface,
                  borderColor: theme.border
                }]}>
                  {selectedTargets.includes(item.id) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  backText: {
    fontSize: 18,
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    marginTop: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  selectorText: {
    flex: 1,
    fontSize: 16,
  },
  arrow: {
    fontSize: 18,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
  },
  summaryCard: {
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    marginBottom: 4,
  },
  sendButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  sendButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
  },
  modalCloseText: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalDoneText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  selectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  selectorItemContent: {
    flex: 1,
  },
  selectorItemLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  selectorItemSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
});

export default SendNotifications;