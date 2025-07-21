// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   ActivityIndicator,
//   ScrollView,
//   TouchableOpacity,
//   Alert,
//   Dimensions,
// } from "react-native";
// import axios from "axios";
// import * as FileSystem from "expo-file-system";
// import * as Sharing from "expo-sharing";
// import { LineChart } from "react-native-chart-kit";
// import RNPickerSelect from "react-native-picker-select";
// import { API_BASE_URL } from "../user_utils/api";

// const screenWidth = Dimensions.get("window").width;
// const API_URL = `${API_BASE_URL}/api/financialSummary/`;

// const FinancialSummary = () => {
//   const [year, setYear] = useState(new Date().getFullYear());
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(false);

//   const fetchSummary = async (selectedYear) => {
//     setLoading(true);
//     try {
//       const token = await localStorage.getItem("accessToken");
//       const response = await axios.get(`${API_URL}?year=${selectedYear}`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });
//       setData(response.data);
//     } catch (error) {
//       Alert.alert("Error", "Failed to fetch data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchSummary(year);
//   }, [year]);

//   const handleExport = async () => {
//     if (!data) return;

//     let csv = "Name,Flat,Total";

//     const months = data.months || [];
//     const specialTitles = new Set();

//     data.members?.forEach((m) => {
//       months.forEach((month) => {
//         if (!csv.includes(month)) csv += `,${month}`;
//       });
//       Object.keys(m.special_income || {}).forEach((title) => {
//         specialTitles.add(title);
//       });
//     });

//     specialTitles.forEach((title) => {
//       if (!csv.includes(title)) csv += `,${title}`;
//     });

//     csv += "\n";

//     data.members?.forEach((m) => {
//       const row = [
//         m.name,
//         m.flat,
//         m.total,
//         ...months.map((month) => m.monthly?.[month] || 0),
//         ...Array.from(specialTitles).map((title) => m.special_income?.[title] || 0),
//       ];
//       csv += row.join(",") + "\n";
//     });

//     const totalRow = [
//       "Total",
//       "",
//       data.total_row?.total || 0,
//       ...months.map((month) => data.total_row.monthly?.[month] || 0),
//       ...Array.from(specialTitles).map((title) => data.total_row.special_income?.[title] || 0),
//     ];
//     csv += totalRow.join(",") + "\n";

//     const fileUri = FileSystem.documentDirectory + `Financial_Summary_${year}.csv`;

//     await FileSystem.writeAsStringAsync(fileUri, csv, {
//       encoding: FileSystem.EncodingType.UTF8,
//     });

//     await Sharing.shareAsync(fileUri, {
//       mimeType: "text/csv",
//       dialogTitle: "Export Financial Summary",
//       UTI: "public.comma-separated-values-text",
//     });
//   };

//   return (
//     <ScrollView className="p-4 bg-gray-100 min-h-screen">
//       <Text className="text-2xl font-bold text-blue-700 mb-3">
//         Financial Summary
//       </Text>

//       {/* Year Picker */}
//       <View className="mb-4 bg-white rounded-lg p-2 shadow">
//         <RNPickerSelect
//           onValueChange={(value) => setYear(value)}
//           value={year}
//           placeholder={{ label: "Select Year", value: null }}
//           items={[
//             { label: "2022", value: 2022 },
//             { label: "2023", value: 2023 },
//             { label: "2024", value: 2024 },
//             { label: "2025", value: 2025 },
//           ]}
//         />
//       </View>

//       <TouchableOpacity
//         onPress={handleExport}
//         className="bg-green-600 p-3 rounded-lg mb-6"
//       >
//         <Text className="text-white text-center font-semibold">
//           Export to CSV
//         </Text>
//       </TouchableOpacity>

//       {loading ? (
//         <ActivityIndicator size="large" color="blue" />
//       ) : data ? (
//         <View>
//           {/* Summary Info */}
//           <View className="space-y-2 mb-6">
//             <Text className="text-base font-medium text-gray-700">
//               Opening Balance: ₹{data.opening_balance}
//             </Text>
//             <Text className="text-base font-medium text-gray-700">
//               Total Income: ₹{data.total_row?.total}
//             </Text>
//             <Text className="text-base font-medium text-gray-700">
//               Total Expense: ₹{data.expenses?.total_expense || 0}
//             </Text>
//             <Text className="text-base font-bold text-green-700">
//               Closing Balance: ₹
//               {(data.opening_balance || 0) +
//                 (data.total_row?.total || 0) -
//                 (data.expenses?.total_expense || 0)}
//             </Text>
//           </View>

//           {/* Chart */}
//           {data.months?.length > 0 && (
//             <LineChart
//               data={{
//                 labels: data.months,
//                 datasets: [
//                   {
//                     data: data.months.map(
//                       (month) => data.total_row.monthly?.[month] || 0
//                     ),
//                     color: () => "#10B981", // green
//                     strokeWidth: 2,
//                   },
//                   {
//                     data: data.months.map(
//                       (month) => data.expenses?.monthly?.[month] || 0
//                     ),
//                     color: () => "#EF4444", // red
//                     strokeWidth: 2,
//                   },
//                 ],
//                 legend: ["Income", "Expense"],
//               }}
//               width={screenWidth - 32}
//               height={240}
//               chartConfig={{
//                 backgroundGradientFrom: "#fff",
//                 backgroundGradientTo: "#fff",
//                 color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
//                 labelColor: () => "#6B7280",
//                 propsForDots: {
//                   r: "4",
//                   strokeWidth: "1",
//                   stroke: "#10B981",
//                 },
//               }}
//               className="mb-8"
//               bezier
//             />
//           )}

//           {/* Scrollable Table */}
//           <ScrollView horizontal className="bg-white rounded-lg shadow p-3">
//             <View>
//               {/* Table Header */}
//               <View className="flex-row border-b border-gray-300 pb-2">
//                 <Text className="w-32 font-bold text-gray-800">Name</Text>
//                 {data.months?.map((month, idx) => (
//                   <Text key={idx} className="w-24 text-gray-700 font-semibold">
//                     {month}
//                   </Text>
//                 ))}
//               </View>

//               {/* Member Rows */}
//               {data.members?.slice(0, 5).map((m, idx) => (
//                 <View key={idx} className="flex-row py-2 border-b border-gray-100">
//                   <Text className="w-32 text-gray-800">{m.name}</Text>
//                   {data.months.map((month, i) => (
//                     <Text key={i} className="w-24 text-gray-700">
//                       ₹{m.monthly?.[month] || 0}
//                     </Text>
//                   ))}
//                 </View>
//               ))}
//             </View>
//           </ScrollView>
//         </View>
//       ) : (
//         <Text className="text-red-500">No data found</Text>
//       )}
//     </ScrollView>
//   );
// };

// export default FinancialSummary;


import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Correct import for AsyncStorage
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { LineChart } from "react-native-chart-kit";
import RNPickerSelect from "react-native-picker-select";

// Make sure API_BASE_URL is accessible and correctly defined
// IMPORTANT: Replace with your actual backend URL for development/production
// const API_BASE_URL = "http://192.168.1.100:8000";
import { API_BASE_URL } from "../user_utils/api";
const API_URL = `${API_BASE_URL}/api/financialSummary/`;

const screenWidth = Dimensions.get("window").width;

const FinancialSummary = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Function to fetch financial summary data
  const fetchSummary = async (selectedYear) => {
    setLoading(true);
    try {
      // Use AsyncStorage instead of localStorage
      const token = await AsyncStorage.getItem("accessToken");
      const response = await axios.get(`${API_URL}?year=${selectedYear}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setData(response.data);
    } catch (error) {
      console.error("Failed to fetch financial summary:", error);
      Alert.alert("Error", "Failed to fetch data. Please check your network connection and try again.");
      setData(null); // Clear data on error
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when the component mounts or when the year changes
  useEffect(() => {
    fetchSummary(year);
  }, [year]);

  // Helper to get unique special income titles from current data
  // Pass 'data' to this function to ensure it operates on the latest state
  const getSpecialTitles = (currentData) => {
    const titlesSet = new Set();
    currentData?.members?.forEach((m) => {
      Object.keys(m.special_income || {}).forEach((title) => titlesSet.add(title));
    });
    return Array.from(titlesSet);
  };

  // Handle export to CSV
  const handleExport = async () => {
    if (!data) {
      Alert.alert("No Data", "No financial data to export.");
      return;
    }

    const months = data.months || [];
    const specialTitles = getSpecialTitles(data); // Get special titles based on current data

    // --- Member Contributions CSV ---
    let memberCsvHeader = ["Name", "Flat", ...months, ...specialTitles, "Total"].join(",");
    let memberCsvBody = data.members.map((m) => {
      const monthlyValues = months.map((month) => m.monthly?.[month] || 0);
      const specialIncomeValues = specialTitles.map((title) => m.special_income?.[title] || 0);
      return [m.name, m.flat, ...monthlyValues, ...specialIncomeValues, m.total].join(",");
    }).join("\n");

    const memberTotalRowValues = months.map((month) => data.total_row.monthly?.[month] || 0);
    const memberSpecialTotalValues = specialTitles.map((title) => data.total_row.special_income?.[title] || 0);
    const memberTotalRow = ["Total", "", ...memberTotalRowValues, ...memberSpecialTotalValues, data.total_row.total || 0].join(",");

    let fullMemberCsv = memberCsvHeader + "\n" + memberCsvBody + "\n" + memberTotalRow;


    // --- Expenses CSV ---
    let expenseCsvHeader = ["Category", ...months, "Total"].join(",");
    let expenseCsvBody = data.expenses?.categories?.map((cat) => {
      const monthlyExpenseValues = months.map((month) => cat.monthly_expenses?.[month] || 0);
      return [cat.category, ...monthlyExpenseValues, cat.total_spent].join(",");
    }).join("\n") || ""; // Ensure empty string if no categories

    const expenseTotalMonthlyValues = months.map((month) => data.expenses?.total_monthly_expense?.[month] || 0);
    const expenseTotalRow = ["Total", ...expenseTotalMonthlyValues, data.expenses?.total_expense || 0].join(",");

    let fullExpenseCsv = expenseCsvHeader + "\n" + expenseCsvBody + "\n" + expenseTotalRow;

    // Combine both into one CSV file
    const combinedCsvContent = `Member Contributions\n${fullMemberCsv}\n\nExpenses\n${fullExpenseCsv}`;

    const fileName = `Financial_Summary_${year}.csv`;
    const fileUri = FileSystem.documentDirectory + fileName;

    try {
      await FileSystem.writeAsStringAsync(fileUri, combinedCsvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await Sharing.shareAsync(fileUri, {
        mimeType: "text/csv",
        dialogTitle: "Export Financial Summary",
        UTI: "public.comma-separated-values-text", // For iOS
      });
      Alert.alert("Export Successful", `Financial Summary for ${year} exported to ${fileName}`);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      Alert.alert("Export Failed", "Could not export CSV. Please try again.");
    }
  };

  // Helper component for generic table headers
  // It's crucial to pass data.months and getSpecialTitles(data) or data.months
  // directly when calling TableHeader within the `data ? (...) : (...)` block
  const TableHeader = ({ titles, widths, justify }) => (
    <View className="flex-row bg-gray-100 border-b border-gray-300 py-2">
      {titles.map((title, index) => (
        <Text
          key={index}
          className={`font-bold text-xs text-gray-700`}
          style={{ width: widths[index], textAlign: justify[index] || 'left' }}
        >
          {title}
        </Text>
      ))}
    </View>
  );

  // Generate year options for the picker
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => {
    const y = currentYear - i;
    // Format for financial year, e.g., 2024-2025
    const endYear = y + 1;
    return { label: `${y}-${endYear.toString().substring(2)}`, value: y };
  });

  // This will be defined only when 'data' is not null, preventing the 'months is not defined' error
  const months = data?.months || [];
  const specialTitles = getSpecialTitles(data);


  return (
    <ScrollView className="flex-1 p-4 bg-gray-50">
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-2xl font-bold text-blue-800">
          Financial Summary - {year}
        </Text>
        <TouchableOpacity
          onPress={handleExport}
          className="bg-green-600 active:bg-green-700 px-4 py-2 rounded-md shadow"
        >
          <Text className="text-white font-medium">Export CSV</Text>
        </TouchableOpacity>
      </View>

      {/* Year Picker */}
      <View className="mb-4 bg-white rounded-lg p-2 shadow-sm border border-gray-200">
        <RNPickerSelect
          onValueChange={(value) => value && setYear(value)}
          value={year}
          placeholder={{ label: "Select Year...", value: null }}
          items={yearOptions}
          style={{
            inputIOS: {
              fontSize: 16,
              paddingVertical: 12,
              paddingHorizontal: 10,
              color: 'black',
              paddingRight: 30,
            },
            inputAndroid: {
              fontSize: 16,
              paddingHorizontal: 10,
              paddingVertical: 8,
              color: 'black',
              paddingRight: 30,
            },
            placeholder: {
              color: '#9CA3AF',
              fontSize: 16,
            },
          }}
        />
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center mt-10">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-500 mt-2">Loading data...</Text>
        </View>
      ) : data ? (
        <View>
          {/* Summary Boxes */}
          <View className="flex-row flex-wrap justify-between mb-6">
            <View className="w-[48%] bg-blue-50 p-3 rounded-md shadow-sm items-center justify-center mb-3">
              <Text className="text-gray-700 font-medium text-base text-center">Opening Balance:</Text>
              <Text className="text-blue-700 font-bold text-lg text-center">₹{data.opening_balance}</Text>
            </View>
            <View className="w-[48%] bg-green-50 p-3 rounded-md shadow-sm items-center justify-center mb-3">
              <Text className="text-gray-700 font-medium text-base text-center">Total Income:</Text>
              <Text className="text-green-700 font-bold text-lg text-center">₹{data.total_row?.total}</Text>
            </View>
            <View className="w-[48%] bg-red-50 p-3 rounded-md shadow-sm items-center justify-center mb-3">
              <Text className="text-gray-700 font-medium text-base text-center">Total Expense:</Text>
              <Text className="text-red-700 font-bold text-lg text-center">₹{data.expenses?.total_expense || 0}</Text>
            </View>
            <View className="w-[48%] bg-yellow-50 p-3 rounded-md shadow-sm items-center justify-center mb-3">
              <Text className="text-gray-700 font-medium text-base text-center">Closing Balance:</Text>
              <Text className="text-yellow-700 font-bold text-lg text-center">
                ₹
                {(data.opening_balance || 0) +
                  (data.total_row?.total || 0) -
                  (data.expenses?.total_expense || 0)}
              </Text>
            </View>
          </View>

          {/* Chart */}
          {months?.length > 0 && data.total_row?.monthly && data.expenses?.total_monthly_expense ? (
            <View className="bg-white rounded-lg shadow-sm p-4 mb-8">
              <Text className="text-lg font-semibold mb-2 text-gray-800">Monthly Income vs. Expense</Text>
              <LineChart
                data={{
                  labels: months,
                  datasets: [
                    {
                      data: months.map(
                        (month) => data.total_row.monthly?.[month] || 0
                      ),
                      color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                      strokeWidth: 2,
                    },
                    {
                      data: months.map(
                        (month) => data.expenses.total_monthly_expense?.[month] || 0
                      ),
                      color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
                      strokeWidth: 2,
                    },
                  ],
                  legend: ["Income", "Expense"],
                }}
                width={screenWidth - 64}
                height={240}
                chartConfig={{
                  backgroundColor: "#ffffff",
                  backgroundGradientFrom: "#ffffff",
                  backgroundGradientTo: "#ffffff",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                  propsForDots: {
                    r: "4",
                    strokeWidth: "1",
                    stroke: "#10B981",
                  },
                  propsForLabels: {
                    fontSize: 10,
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: "0",
                    stroke: "#E5E7EB",
                  },
                }}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
              />
            </View>
          ) : (
            <Text className="text-gray-500 text-center mb-8">Not enough data to display chart.</Text>
          )}

          {/* Member Contributions Table */}
          <Text className="text-xl font-semibold mt-6 mb-3 text-blue-700">Member Contributions</Text>
          <View className="rounded-md shadow ring-1 ring-gray-200 bg-white overflow-hidden mb-8">
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View>
                {/* Table Header: Name, Flat, Months, Special Income, Total */}
                <TableHeader
                  titles={["Name", "Flat", ...months, ...specialTitles, "Total"]}
                  widths={[120, 60, ...Array(months.length).fill(80), ...Array(specialTitles.length).fill(100), 100]}
                  justify={['left', 'left', ...Array(months.length).fill('right'), ...Array(specialTitles.length).fill('right'), 'right']}
                />
                {/* Member Data Rows */}
                {data.members?.length > 0 ? (
                  data.members.map((m, idx) => (
                    <View
                      key={idx}
                      className={`flex-row py-2 border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      <Text className="w-[120px] text-gray-800 text-xs">{m.name}</Text>
                      <Text className="w-[60px] text-gray-700 text-xs">{m.flat}</Text>
                      {months.map((mon, i) => (
                        <Text key={i} className="w-[80px] text-gray-700 text-xs text-right">
                          ₹{m.monthly?.[mon] || 0}
                        </Text>
                      ))}
                      {specialTitles.map((title, i) => (
                        <Text key={i} className="w-[100px] text-gray-700 text-xs text-right">
                          ₹{m.special_income?.[title] || 0}
                        </Text>
                      ))}
                      <Text className="w-[100px] text-green-700 font-semibold text-xs text-right">
                        ₹{m.total}
                      </Text>
                    </View>
                  ))
                ) : (
                  <View className="py-4 px-3">
                    <Text className="text-gray-500 text-center w-full">No member contributions found for this year.</Text>
                  </View>
                )}
                {/* Member Total Row */}
                <View className="flex-row py-2 bg-gray-200 border-t border-gray-300">
                  <Text className="w-[180px] text-gray-800 font-bold text-xs">Total</Text>
                  {months.map((mon, i) => (
                    <Text key={i} className="w-[80px] text-gray-700 font-bold text-xs text-right">
                      ₹{data.total_row?.monthly?.[mon] || 0}
                    </Text>
                  ))}
                  {specialTitles.map((title, i) => (
                    <Text key={i} className="w-[100px] text-gray-700 font-bold text-xs text-right">
                      ₹{data.total_row?.special_income?.[title] || 0}
                    </Text>
                  ))}
                  <Text className="w-[100px] text-green-800 font-extrabold text-xs text-right">
                    ₹{data.total_row?.total || 0}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>

          {/* Expense Table */}
          <Text className="text-xl font-semibold mt-6 mb-3 text-red-700">Expenses by Category</Text>
          <View className="rounded-md shadow ring-1 ring-gray-200 bg-white overflow-hidden mb-8">
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View>
                {/* Table Header: Category, Months, Total */}
                <TableHeader
                  titles={["Category", ...months, "Total"]}
                  widths={[120, ...Array(months.length).fill(80), 100]}
                  justify={['left', ...Array(months.length).fill('right'), 'right']}
                />
                {/* Expense Data Rows */}
                {data.expenses?.categories?.length > 0 ? (
                  data.expenses.categories.map((c, idx) => (
                    <View
                      key={idx}
                      className={`flex-row py-2 border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      <Text className="w-[120px] text-gray-800 text-xs">{c.category}</Text>
                      {months.map((mon, i) => (
                        <Text key={i} className="w-[80px] text-gray-700 text-xs text-right">
                          ₹{c.monthly_expenses?.[mon] || 0}
                        </Text>
                      ))}
                      <Text className="w-[100px] text-red-700 font-semibold text-xs text-right">
                        ₹{c.total_spent}
                      </Text>
                    </View>
                  ))
                ) : (
                  <View className="py-4 px-3">
                    <Text className="text-gray-500 text-center w-full">No expenses found for this year.</Text>
                  </View>
                )}
                {/* Expense Total Row */}
                <View className="flex-row py-2 bg-gray-200 border-t border-gray-300">
                  <Text className="w-[120px] text-gray-800 font-bold text-xs">Total</Text>
                  {months.map((mon, i) => (
                    <Text key={i} className="w-[80px] text-gray-700 font-bold text-xs text-right">
                      ₹{data.expenses?.total_monthly_expense?.[mon] || 0}
                    </Text>
                  ))}
                  <Text className="w-[100px] text-red-800 font-extrabold text-xs text-right">
                    ₹{data.expenses?.total_expense || 0}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      ) : (
        <Text className="text-red-500 text-center mt-10">No data found for the selected year.</Text>
      )}
    </ScrollView>
  );
};

export default FinancialSummary;