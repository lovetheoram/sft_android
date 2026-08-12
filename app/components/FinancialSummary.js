/**
 * FinancialSummary — Full rewrite for Android/iOS
 * - Year picker (native Picker)
 * - Summary stat cards (Opening Balance, Income, Expense, Closing)
 * - Monthly Income vs Expense line chart (react-native-chart-kit)
 * - Horizontally scrollable member contributions table
 * - Horizontally scrollable expense by category table
 * - CSV Export via expo-sharing
 * - SuperAdmin building switcher
 * - AI Financial Report button
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, ActivityIndicator, ScrollView, TouchableOpacity,
  Alert, Dimensions, RefreshControl,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { LineChart } from 'react-native-chart-kit';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import financeService from '../user_utils/services/financeService';
import buildingService from '../user_utils/services/buildingService';
import { useAuth } from '../user_utils/AuthContext';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, bgColor, borderColor, textColor, emoji }) => (
  <View style={{
    flex: 1,
    backgroundColor: bgColor,
    borderWidth: 1,
    borderColor,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  }}>
    <Text style={{ fontSize: 20, marginBottom: 4 }}>{emoji}</Text>
    <Text style={{ fontSize: 11, color: '#64748b', fontWeight: '600', textAlign: 'center', marginBottom: 4 }}>
      {label}
    </Text>
    <Text style={{ fontSize: 16, fontWeight: '800', color: textColor, textAlign: 'center' }}>
      ₹{(value || 0).toLocaleString('en-IN')}
    </Text>
  </View>
);

// ─── Section Header ──────────────────────────────────────────────────────────
const SectionHeader = ({ title, color = '#0f172a' }) => (
  <Text style={{
    fontSize: 15,
    fontWeight: '800',
    color,
    marginTop: 20,
    marginBottom: 10,
    marginHorizontal: 16,
  }}>
    {title}
  </Text>
);

// ─── Table Header Row ─────────────────────────────────────────────────────────
const TableHeaderRow = ({ cols }) => (
  <View style={{
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1.5,
    borderBottomColor: '#cbd5e1',
    paddingVertical: 8,
    paddingHorizontal: 2,
  }}>
    {cols.map((col, i) => (
      <Text
        key={i}
        style={{
          width: col.width,
          fontSize: 10,
          fontWeight: '800',
          color: '#475569',
          textAlign: col.align || 'left',
          paddingHorizontal: 4,
        }}
      >
        {col.label}
      </Text>
    ))}
  </View>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const FinancialSummary = () => {
  const { isSuperAdmin } = useAuth();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState('');
  const [showAiReport, setShowAiReport] = useState(false);

  const yearOptions = Array.from({ length: 8 }, (_, i) => currentYear - i);

  // Fetch buildings for SuperAdmin switcher
  useEffect(() => {
    if (!isSuperAdmin) return;
    buildingService.getBuildings()
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.results || []);
        setBuildings(list);
      })
      .catch(() => {});
  }, [isSuperAdmin]);

  const fetchSummary = async (selectedYear = year, bldgId = selectedBuilding) => {
    setLoading(true);
    try {
      const params = { year: selectedYear };
      if (bldgId) params.building_id = bldgId;
      const responseData = await financeService.getSummary(selectedYear, bldgId ? { building_id: bldgId } : {});
      setData(responseData);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch financial data. Please check your connection.');
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchSummary(); }, [year, selectedBuilding]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSummary();
  };

  // Helper: unique special income titles
  const getSpecialTitles = (d) => {
    const s = new Set();
    d?.members?.forEach((m) => Object.keys(m.special_income || {}).forEach((t) => s.add(t)));
    return Array.from(s);
  };

  const handleExport = async () => {
    if (!data) {
      Alert.alert('No Data', 'No data to export.');
      return;
    }
    const months = data.months || [];
    const specialTitles = getSpecialTitles(data);

    let memberCsvHeader = ['Name', 'Flat', ...months, ...specialTitles, 'Total'].join(',');
    let memberCsvBody = (data.members || []).map((m) => {
      const monthVals = months.map((mon) => m.monthly?.[mon] || 0);
      const specialVals = specialTitles.map((t) => m.special_income?.[t] || 0);
      return [m.name, m.flat, ...monthVals, ...specialVals, m.total].join(',');
    }).join('\n');
    const memberTotal = ['Total', '', ...months.map((mon) => data.total_row?.monthly?.[mon] || 0), ...specialTitles.map((t) => data.total_row?.special_income?.[t] || 0), data.total_row?.total || 0].join(',');

    let expCsvHeader = ['Category', ...months, 'Total'].join(',');
    let expCsvBody = (data.expenses?.categories || []).map((c) => {
      return [c.category, ...months.map((mon) => c.monthly_expenses?.[mon] || 0), c.total_spent].join(',');
    }).join('\n');
    const expTotal = ['Total', ...months.map((mon) => data.expenses?.total_monthly_expense?.[mon] || 0), data.expenses?.total_expense || 0].join(',');

    const csv = `Society Financial Summary — ${year}\n\nMember Contributions\n${memberCsvHeader}\n${memberCsvBody}\n${memberTotal}\n\nExpenses by Category\n${expCsvHeader}\n${expCsvBody}\n${expTotal}`;
    const fileUri = FileSystem.documentDirectory + `Financial_Summary_${year}.csv`;
    try {
      await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: `Export ${year} Summary` });
    } catch {
      Alert.alert('Export Failed', 'Could not export CSV.');
    }
  };

  const months = data?.months || [];
  const specialTitles = getSpecialTitles(data);
  const closingBalance = (data?.opening_balance || 0) + (data?.total_row?.total || 0) - (data?.expenses?.total_expense || 0);

  // Chart data
  const chartLabels = months.length > 6 ? months.filter((_, i) => i % 2 === 0) : months;
  const chartIncomeData = months.map((m) => data?.total_row?.monthly?.[m] || 0);
  const chartExpenseData = months.map((m) => data?.expenses?.total_monthly_expense?.[m] || 0);
  const hasChartData = months.length > 0 && data?.total_row?.monthly;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f8fafc' }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284c7']} />}
    >
      {/* ── Header ── */}
      <View style={{
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>📊 Financial Summary</Text>
          <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Income, expenses & balance sheet</Text>
        </View>
        <TouchableOpacity
          onPress={handleExport}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: '#ecfdf5',
            borderWidth: 1,
            borderColor: '#a7f3d0',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 10,
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="share-outline" size={16} color="#059669" />
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#059669' }}>Export</Text>
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 12 }}>
        {/* ── Year + Building pickers ── */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {/* Year Picker */}
          <View style={{
            flex: 1,
            borderWidth: 1,
            borderColor: '#e2e8f0',
            borderRadius: 12,
            backgroundColor: '#fff',
            overflow: 'hidden',
          }}>
            <Picker
              selectedValue={year}
              onValueChange={(val) => setYear(val)}
              style={{ height: 48, color: '#0f172a' }}
              dropdownIconColor="#94a3b8"
            >
              {yearOptions.map((y) => (
                <Picker.Item key={y} label={`FY ${y}–${(y + 1).toString().slice(-2)}`} value={y} />
              ))}
            </Picker>
          </View>

          {/* SuperAdmin Building Switcher */}
          {isSuperAdmin && buildings.length > 0 && (
            <View style={{
              flex: 1,
              borderWidth: 1,
              borderColor: '#e2e8f0',
              borderRadius: 12,
              backgroundColor: '#fff',
              overflow: 'hidden',
            }}>
              <Picker
                selectedValue={selectedBuilding}
                onValueChange={(val) => setSelectedBuilding(val)}
                style={{ height: 48, color: '#0f172a' }}
                dropdownIconColor="#94a3b8"
              >
                <Picker.Item label="All Buildings" value="" />
                {buildings.map((b) => (
                  <Picker.Item key={b.id} label={b.name} value={String(b.id)} />
                ))}
              </Picker>
            </View>
          )}
        </View>

        {loading ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
            <ActivityIndicator size="large" color="#0284c7" />
            <Text style={{ color: '#64748b', marginTop: 12, fontSize: 13 }}>Loading financial data...</Text>
          </View>
        ) : data ? (
          <>
            {/* ── Stat Cards 2x2 grid ── */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <StatCard label="Opening Balance" value={data.opening_balance} emoji="🏦" bgColor="#eff6ff" borderColor="#bfdbfe" textColor="#1d4ed8" />
              <StatCard label="Total Income" value={data.total_row?.total} emoji="💰" bgColor="#ecfdf5" borderColor="#a7f3d0" textColor="#059669" />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <StatCard label="Total Expenses" value={data.expenses?.total_expense} emoji="💸" bgColor="#fff1f2" borderColor="#fecdd3" textColor="#e11d48" />
              <StatCard label="Closing Balance" value={closingBalance} emoji="📈" bgColor={closingBalance >= 0 ? '#f0fdf4' : '#fff1f2'} borderColor={closingBalance >= 0 ? '#bbf7d0' : '#fecdd3'} textColor={closingBalance >= 0 ? '#15803d' : '#e11d48'} />
            </View>

            {/* ── Monthly Chart ── */}
            {hasChartData && chartIncomeData.some((v) => v > 0) ? (
              <View style={{
                backgroundColor: '#fff',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#e2e8f0',
                paddingTop: 16,
                paddingBottom: 4,
                overflow: 'hidden',
              }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a', paddingHorizontal: 16, marginBottom: 8 }}>
                  📉 Monthly Income vs Expense
                </Text>
                <LineChart
                  data={{
                    labels: chartLabels,
                    datasets: [
                      {
                        data: chartIncomeData.length > 0 ? chartIncomeData : [0],
                        color: (opacity = 1) => `rgba(5, 150, 105, ${opacity})`,
                        strokeWidth: 2.5,
                      },
                      {
                        data: chartExpenseData.length > 0 ? chartExpenseData : [0],
                        color: (opacity = 1) => `rgba(225, 29, 72, ${opacity})`,
                        strokeWidth: 2.5,
                      },
                    ],
                    legend: ['Income', 'Expense'],
                  }}
                  width={SCREEN_W - 32}
                  height={200}
                  chartConfig={{
                    backgroundColor: '#fff',
                    backgroundGradientFrom: '#fff',
                    backgroundGradientTo: '#fff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    labelColor: () => '#94a3b8',
                    propsForDots: { r: '3', strokeWidth: '1.5' },
                    propsForLabels: { fontSize: 9 },
                    propsForBackgroundLines: { strokeDasharray: '4', stroke: '#f1f5f9', strokeWidth: 1 },
                    formatYLabel: (v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v,
                  }}
                  bezier
                  style={{ marginLeft: -8, borderRadius: 0 }}
                  fromZero
                  withShadow={false}
                />
              </View>
            ) : (
              <View style={{ backgroundColor: '#f8fafc', borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed' }}>
                <Text style={{ fontSize: 24, marginBottom: 8 }}>📊</Text>
                <Text style={{ color: '#94a3b8', fontSize: 13 }}>No chart data for this period</Text>
              </View>
            )}
          </>
        ) : null}
      </View>

      {/* ── Member Contributions Table ── */}
      {data?.members && (
        <>
          <SectionHeader title="👥 Member Contributions" color="#1d4ed8" />
          <View style={{
            marginHorizontal: 16,
            backgroundColor: '#fff',
            borderRadius: 14,
            borderWidth: 1,
            borderColor: '#e2e8f0',
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOpacity: 0.04,
            shadowRadius: 6,
            elevation: 2,
          }}>
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <View>
                <TableHeaderRow cols={[
                  { label: 'Member', width: 130, align: 'left' },
                  { label: 'Flat', width: 60, align: 'left' },
                  ...months.map((m) => ({ label: m, width: 75, align: 'right' })),
                  ...specialTitles.map((t) => ({ label: t.slice(0, 12), width: 100, align: 'right' })),
                  { label: 'Total', width: 90, align: 'right' },
                ]} />

                {data.members.map((m, idx) => (
                  <View key={idx} style={{
                    flexDirection: 'row',
                    paddingVertical: 9,
                    paddingHorizontal: 2,
                    backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa',
                    borderBottomWidth: 1,
                    borderBottomColor: '#f1f5f9',
                  }}>
                    <Text style={{ width: 130, fontSize: 11, color: '#1e293b', fontWeight: '500', paddingHorizontal: 4 }} numberOfLines={1}>{m.name}</Text>
                    <Text style={{ width: 60, fontSize: 11, color: '#475569', paddingHorizontal: 4 }}>{m.flat}</Text>
                    {months.map((mon, i) => (
                      <Text key={i} style={{ width: 75, fontSize: 11, color: (m.monthly?.[mon] || 0) > 0 ? '#059669' : '#94a3b8', textAlign: 'right', paddingHorizontal: 4 }}>
                        {(m.monthly?.[mon] || 0) > 0 ? `₹${m.monthly[mon]}` : '—'}
                      </Text>
                    ))}
                    {specialTitles.map((t, i) => (
                      <Text key={i} style={{ width: 100, fontSize: 11, color: (m.special_income?.[t] || 0) > 0 ? '#7c3aed' : '#94a3b8', textAlign: 'right', paddingHorizontal: 4 }}>
                        {(m.special_income?.[t] || 0) > 0 ? `₹${m.special_income[t]}` : '—'}
                      </Text>
                    ))}
                    <Text style={{ width: 90, fontSize: 12, color: '#059669', fontWeight: '800', textAlign: 'right', paddingHorizontal: 4 }}>
                      ₹{(m.total || 0).toLocaleString('en-IN')}
                    </Text>
                  </View>
                ))}

                {/* Total row */}
                <View style={{ flexDirection: 'row', paddingVertical: 9, paddingHorizontal: 2, backgroundColor: '#f0f9ff', borderTopWidth: 2, borderTopColor: '#bae6fd' }}>
                  <Text style={{ width: 190, fontSize: 12, fontWeight: '800', color: '#0f172a', paddingHorizontal: 4 }}>TOTAL</Text>
                  {months.map((mon, i) => (
                    <Text key={i} style={{ width: 75, fontSize: 12, fontWeight: '800', color: '#0f172a', textAlign: 'right', paddingHorizontal: 4 }}>
                      ₹{data.total_row?.monthly?.[mon] || 0}
                    </Text>
                  ))}
                  {specialTitles.map((t, i) => (
                    <Text key={i} style={{ width: 100, fontSize: 12, fontWeight: '800', color: '#7c3aed', textAlign: 'right', paddingHorizontal: 4 }}>
                      ₹{data.total_row?.special_income?.[t] || 0}
                    </Text>
                  ))}
                  <Text style={{ width: 90, fontSize: 13, fontWeight: '900', color: '#059669', textAlign: 'right', paddingHorizontal: 4 }}>
                    ₹{(data.total_row?.total || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </>
      )}

      {/* ── Expense by Category Table ── */}
      {data?.expenses?.categories && (
        <>
          <SectionHeader title="💸 Expenses by Category" color="#e11d48" />
          <View style={{
            marginHorizontal: 16,
            marginBottom: 24,
            backgroundColor: '#fff',
            borderRadius: 14,
            borderWidth: 1,
            borderColor: '#e2e8f0',
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOpacity: 0.04,
            shadowRadius: 6,
            elevation: 2,
          }}>
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <View>
                <TableHeaderRow cols={[
                  { label: 'Category', width: 130, align: 'left' },
                  ...months.map((m) => ({ label: m, width: 75, align: 'right' })),
                  { label: 'Total', width: 90, align: 'right' },
                ]} />

                {data.expenses.categories.length === 0 ? (
                  <View style={{ paddingVertical: 20, paddingHorizontal: 16 }}>
                    <Text style={{ color: '#94a3b8', fontSize: 13 }}>No expenses recorded for this period.</Text>
                  </View>
                ) : data.expenses.categories.map((c, idx) => (
                  <View key={idx} style={{
                    flexDirection: 'row',
                    paddingVertical: 9,
                    paddingHorizontal: 2,
                    backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa',
                    borderBottomWidth: 1,
                    borderBottomColor: '#f1f5f9',
                  }}>
                    <Text style={{ width: 130, fontSize: 11, color: '#1e293b', fontWeight: '500', paddingHorizontal: 4 }} numberOfLines={1}>{c.category}</Text>
                    {months.map((mon, i) => (
                      <Text key={i} style={{ width: 75, fontSize: 11, color: (c.monthly_expenses?.[mon] || 0) > 0 ? '#e11d48' : '#94a3b8', textAlign: 'right', paddingHorizontal: 4 }}>
                        {(c.monthly_expenses?.[mon] || 0) > 0 ? `₹${c.monthly_expenses[mon]}` : '—'}
                      </Text>
                    ))}
                    <Text style={{ width: 90, fontSize: 12, color: '#e11d48', fontWeight: '800', textAlign: 'right', paddingHorizontal: 4 }}>
                      ₹{(c.total_spent || 0).toLocaleString('en-IN')}
                    </Text>
                  </View>
                ))}

                {/* Expense Total row */}
                <View style={{ flexDirection: 'row', paddingVertical: 9, paddingHorizontal: 2, backgroundColor: '#fff1f2', borderTopWidth: 2, borderTopColor: '#fecdd3' }}>
                  <Text style={{ width: 130, fontSize: 12, fontWeight: '800', color: '#0f172a', paddingHorizontal: 4 }}>TOTAL</Text>
                  {months.map((mon, i) => (
                    <Text key={i} style={{ width: 75, fontSize: 12, fontWeight: '800', color: '#0f172a', textAlign: 'right', paddingHorizontal: 4 }}>
                      ₹{data.expenses?.total_monthly_expense?.[mon] || 0}
                    </Text>
                  ))}
                  <Text style={{ width: 90, fontSize: 13, fontWeight: '900', color: '#e11d48', textAlign: 'right', paddingHorizontal: 4 }}>
                    ₹{(data.expenses?.total_expense || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </>
      )}

      {!loading && !data && (
        <View style={{ alignItems: 'center', paddingVertical: 60 }}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>📊</Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#334155' }}>No data for {year}</Text>
          <Text style={{ color: '#94a3b8', fontSize: 13, marginTop: 6 }}>Try a different year or pull down to refresh.</Text>
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
};

export default FinancialSummary;