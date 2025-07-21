import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, FlatList, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// import { API_BASE_URL } from '../AnnouncementPageUser.js/api';
import { API_BASE_URL } from '../user_utils/api';
// Components (converted to React Native)
import HomePage from '../components/HomePage';
import LoginPage from '../components/LoginPage';
import SignupPage from '../components/SignupPage';
import ProfilePage from '../components/ProfilePage';
import IncomePage from '../components/IncomePage';
import ExpensePage from '../components/ExpensePage'; 
// import AdminDashboard from '../components/admin/AdminDashboard';
// import AdminPanel from '../components/admin_panel/AdminPanel';
// import AnnouncementPageUser from '../components/user_utils/AnnouncementPageUser';
// import ComplaintForm from '../components/user_utils/ComplaintForm';
// import AnnouncementPage from '../components/AnnouncementPage';
import AdminPanel from '../components/admin_panel/AdminHome';
// import ComplaintForm from '../AnnouncementPageUser.js/ComplaintForm'
import ComplaintForm from '../user_utils/ComplaintForm'
// import AdminPanel '../components/admin_panel/AdminPanel';
// import AdminPanel from '../components/AdminP'
// import AnnouncemetPage '../user_utils/AnnouncementPage';
import AnnouncementPageUser from '../user_utils/AnnouncementPageUser'
import FinancialSummary from '../components/FinancialSummary'
import AdminDashboard from '../components/admin/AdminDashboard'
export default function index() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState(null);
  const [flatExist, setFlatExist] = useState(false);

  const fetchUserProfile = async () => {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) return;
 try {
    const [, payloadBase64] = token.split('.');
    const payload = JSON.parse(atob(payloadBase64));
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp < currentTime) {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
      return;
    }

   
      const res = await axios.get(`${API_BASE_URL}/api/currentUser/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setIsLoggedIn(true);
      setRole(res.data.role);
      if (res.data.flat != null) setFlatExist(true);
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      setIsLoggedIn(false);
      setRole(null);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    fetchUserProfile();
    setActiveIndex(0);
  };

  const handleSignupSuccess = () => {
    setActiveIndex(1);
  };

  const isAdmin = role === 'admin';

  const allTabs = [
    { label: 'Home', component: <HomePage /> },
    { label: 'Login', component: <LoginPage onLoginSuccess={handleLoginSuccess} />,condition: !isLoggedIn, },
    { label: 'Signup', component: <SignupPage onSignupSuccess={handleSignupSuccess} /> ,condition: !isLoggedIn,},
    { label: 'Profile', component: <ProfilePage />, condition: isLoggedIn },
    { label: 'Announcement', component: <AnnouncementPageUser />, condition: isLoggedIn },
    { label: 'Complaint', component: <ComplaintForm />, condition: isLoggedIn },
    { label: 'Income', component: <IncomePage />, condition: isLoggedIn && flatExist },
    { label: 'Expense', component: <ExpensePage />, condition: isAdmin && flatExist },
    {
      label: 'Financial Summary',component:<FinancialSummary/> ,condition: isLoggedIn && flatExist,
    },
    // { label: 'Admin Dashboard', component: <AdminDashboard />, condition: isAdmin },
    { label: 'Admin Panel', component: <AdminPanel />, condition: isAdmin },
    { label: 'Admin Dashboard', component: <AdminDashboard/>, condition: isAdmin}
    
  ];

  const TABS = allTabs.filter(tab => tab.condition === undefined || tab.condition);

  // return (
  //   <SafeAreaView className="flex-1 bg-gray-100 p-4">
  //     <Text className="text-2xl font-bold text-center mb-4">
  //       🏘️ Society Finance Tracker
  //     </Text>

  //     <FlatList
  //       data={TABS}
  //       keyExtractor={(item) => item.label}
  //       horizontal
  //       contentContainerStyle={{ gap: 8 }}
  //       renderItem={({ item, index }) => (
  //         <Pressable
  //           className={`px-4 py-2 rounded ${
  //             index === activeIndex ? 'bg-purple-600' : 'bg-white border'
  //           }`}
  //           onPress={() => setActiveIndex(index)}
  //         >
  //           <Text className={index === activeIndex ? 'text-white font-bold' : 'text-black'}>
  //             {item.label}
  //           </Text>
  //         </Pressable>
  //       )}
  //     />

  //     <View className="flex-1 mt-4">{TABS[activeIndex]?.component}</View>
  //   </SafeAreaView>
  // );

return (
  <SafeAreaView className="flex-1 bg-white pt-6 px-4">
    <Text className="text-3xl font-extrabold text-center text-purple-700 mb-6">
      🏘️ Society Finance Tracker
    </Text>

    <View className="mb-4">
      <FlatList
        data={TABS}
        keyExtractor={(item) => item.label}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingHorizontal: 4 }}
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() => setActiveIndex(index)}
            className={`px-5 py-2 rounded-full border ${
              index === activeIndex
                ? "bg-purple-600 border-purple-600"
                : "bg-gray-100 border-gray-300"
            }`}
          >
            <Text
              className={`text-sm ${
                index === activeIndex
                  ? "text-white font-semibold"
                  : "text-gray-800"
              }`}
            >
              {item.label}
            </Text>
          </Pressable>
        )}
      />
    </View>

    <View className="flex-1 rounded-xl bg-gray-50 p-4 shadow-sm border border-gray-200">
      {TABS[activeIndex]?.component}
    </View>
  </SafeAreaView>
);

}
