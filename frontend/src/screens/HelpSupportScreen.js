import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const HelpSupportScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const faqData = {
    parent: [
      {
        question: "How do I check my child's attendance?",
        answer: "Go to the main dashboard and tap on 'View Children'. Select your child to see detailed attendance records, including daily status and monthly summaries."
      },
      {
        question: "Why didn't I receive a notification about my child's absence?",
        answer: "Check your notification settings in Profile > Settings. Ensure push notifications are enabled and your phone allows notifications from this app."
      },
      {
        question: "How can I contact my child's teacher?",
        answer: "Use the 'Messages' feature from the main menu to send messages directly to your child's class teacher."
      },
      {
        question: "What do the different attendance statuses mean?",
        answer: "• Present: Your child was in school\n• Absent: Your child was not in school\n• Late: Your child arrived after the designated time\n• Excused: Your child had an approved absence"
      },
      {
        question: "How do I update my contact information?",
        answer: "Go to Profile > Edit Profile to update your phone number, address, and other contact details."
      }
    ],
    teacher: [
      {
        question: "How do I mark attendance for my class?",
        answer: "Go to 'Take Attendance' from the main menu, select your class and date, then mark each student as Present, Absent, Late, or Excused."
      },
      {
        question: "Can I modify attendance after it's been marked?",
        answer: "Yes, you can modify attendance by going to 'Attendance History', finding the specific date and student, and updating their status."
      },
      {
        question: "How do I send notifications to parents?",
        answer: "Use 'Send Notifications' from the main menu to send custom messages to all parents or specific parents in your class."
      },
      {
        question: "How can I view attendance reports?",
        answer: "Go to 'View Reports' to see detailed attendance statistics for your classes, including daily, weekly, and monthly summaries."
      },
      {
        question: "What if a student is consistently absent?",
        answer: "You can generate attendance reports to identify patterns and contact parents directly through the messaging system."
      }
    ],
    admin: [
      {
        question: "How do I add new teachers to the system?",
        answer: "Go to 'Manage Teachers' and tap the '+' button to add new teachers. Fill in their details including employee ID and contact information."
      },
      {
        question: "How do I manage classes and students?",
        answer: "Use 'Manage Classes' to create and modify classes, and 'Manage Students' to add, edit, or transfer students between classes."
      },
      {
        question: "How can I configure system settings?",
        answer: "Access 'System Settings' to configure school information, session timings, attendance rules, and notification preferences."
      },
      {
        question: "How do I generate comprehensive reports?",
        answer: "Use 'View Reports' to generate various reports including attendance summaries, teacher performance, and student statistics."
      },
      {
        question: "How do I handle parent complaints or issues?",
        answer: "Monitor the messaging system and use the notification system to communicate with parents. Check attendance patterns to investigate issues."
      }
    ]
  };

  const contactInfo = {
    email: "support@schoolattendance.com",
    phone: "+1 (555) 123-4567",
    website: "https://schoolattendance.com/help"
  };

  const getCurrentFAQs = () => {
    return faqData[user?.role?.toLowerCase()] || [];
  };

  const toggleFAQ = (index) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const submitFeedback = async () => {
    if (!feedbackText.trim()) {
      Alert.alert('Error', 'Please enter your feedback');
      return;
    }

    setSubmittingFeedback(true);
    try {
      // Simulate API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert(
        'Thank You!',
        'Your feedback has been submitted successfully. We appreciate your input!',
        [{ text: 'OK', onPress: () => setFeedbackText('') }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleContactPress = async (type, value) => {
    try {
      let url;
      switch (type) {
        case 'email':
          url = `mailto:${value}?subject=Support Request - ${user?.role} User`;
          break;
        case 'phone':
          url = `tel:${value}`;
          break;
        case 'website':
          url = value;
          break;
        default:
          return;
      }
      
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', `Cannot open ${type}`);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to open ${type}`);
    }
  };

  const renderSection = (title, children) => (
    <View style={[styles.section, { backgroundColor: theme.surface }]}>
      <Text style={[styles.sectionTitle, { color: theme.primary }]}>{title}</Text>
      {children}
    </View>
  );

  const renderFAQ = (faq, index) => (
    <View key={index} style={styles.faqContainer}>
      <TouchableOpacity
        style={[styles.faqQuestion, { borderBottomColor: theme.borderColor }]}
        onPress={() => toggleFAQ(index)}
      >
        <Text style={[styles.questionText, { color: theme.text }]}>{faq.question}</Text>
        <Text style={[styles.expandIcon, { color: theme.primary }]}>
          {expandedFAQ === index ? '−' : '+'}
        </Text>
      </TouchableOpacity>
      {expandedFAQ === index && (
        <View style={[styles.faqAnswer, { backgroundColor: theme.background }]}>
          <Text style={[styles.answerText, { color: theme.text }]}>{faq.answer}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Quick Help */}
        {renderSection(
          'Quick Help',
          <View style={styles.quickHelpContainer}>
            <Text style={[styles.quickHelpText, { color: theme.text }]}>
              Welcome to the School Attendance Management System! Below you'll find answers to common questions and ways to get additional support.
            </Text>
          </View>
        )}

        {/* FAQ Section */}
        {renderSection(
          `Frequently Asked Questions - ${user?.role || 'User'}`,
          <View style={styles.faqList}>
            {getCurrentFAQs().map(renderFAQ)}
          </View>
        )}

        {/* Contact Information */}
        {renderSection(
          'Contact Support',
          <View style={styles.contactContainer}>
            <TouchableOpacity
              style={[styles.contactItem, { borderBottomColor: theme.borderColor }]}
              onPress={() => handleContactPress('email', contactInfo.email)}
            >
              <Text style={[styles.contactLabel, { color: theme.text }]}>Email Support</Text>
              <Text style={[styles.contactValue, { color: theme.primary }]}>
                {contactInfo.email}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.contactItem, { borderBottomColor: theme.borderColor }]}
              onPress={() => handleContactPress('phone', contactInfo.phone)}
            >
              <Text style={[styles.contactLabel, { color: theme.text }]}>Phone Support</Text>
              <Text style={[styles.contactValue, { color: theme.primary }]}>
                {contactInfo.phone}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => handleContactPress('website', contactInfo.website)}
            >
              <Text style={[styles.contactLabel, { color: theme.text }]}>Help Center</Text>
              <Text style={[styles.contactValue, { color: theme.primary }]}>
                Visit Online Help
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Feedback Section */}
        {renderSection(
          'Send Feedback',
          <View style={styles.feedbackContainer}>
            <Text style={[styles.feedbackLabel, { color: theme.text }]}>
              Help us improve! Share your feedback or suggestions:
            </Text>
            <TextInput
              style={[
                styles.feedbackInput,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.borderColor,
                  color: theme.text,
                },
              ]}
              multiline
              numberOfLines={4}
              value={feedbackText}
              onChangeText={setFeedbackText}
              placeholder="Type your feedback here..."
              placeholderTextColor={theme.placeholder}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: theme.primary,
                  opacity: submittingFeedback ? 0.6 : 1,
                },
              ]}
              onPress={submitFeedback}
              disabled={submittingFeedback}
            >
              {submittingFeedback ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Feedback</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* App Information */}
        {renderSection(
          'App Information',
          <View style={styles.appInfoContainer}>
            <View style={styles.appInfoItem}>
              <Text style={[styles.appInfoLabel, { color: theme.text }]}>Version</Text>
              <Text style={[styles.appInfoValue, { color: theme.text }]}>1.0.0</Text>
            </View>
            <View style={styles.appInfoItem}>
              <Text style={[styles.appInfoLabel, { color: theme.text }]}>Last Updated</Text>
              <Text style={[styles.appInfoValue, { color: theme.text }]}>
                {new Date().toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 20,
    borderRadius: 10,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  quickHelpContainer: {
    padding: 10,
  },
  quickHelpText: {
    fontSize: 16,
    lineHeight: 24,
  },
  faqList: {
    marginTop: 5,
  },
  faqContainer: {
    marginBottom: 10,
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  questionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  expandIcon: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  faqAnswer: {
    padding: 15,
    borderRadius: 8,
    marginTop: 5,
  },
  answerText: {
    fontSize: 15,
    lineHeight: 22,
  },
  contactContainer: {
    marginTop: 5,
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  contactLabel: {
    fontSize: 16,
  },
  contactValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  feedbackContainer: {
    marginTop: 5,
  },
  feedbackLabel: {
    fontSize: 16,
    marginBottom: 10,
  },
  feedbackInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    height: 100,
    fontSize: 16,
    marginBottom: 15,
  },
  submitButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  appInfoContainer: {
    marginTop: 5,
  },
  appInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  appInfoLabel: {
    fontSize: 16,
  },
  appInfoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default HelpSupportScreen;