/**
 * FinancialSummary — Full Web Parity Upgrade for React Native (Android/iOS)
 * - Layout matches web EXACTLY: Controls -> KPI Cards -> Member Table -> Expense Table -> CHARTS AT BOTTOM
 * - SVG Bar Charts (Monthly Income Collections & Monthly Expense Outflows) matching web graph type
 * - SVG Donut Chart (Expense Category Breakdown) matching web graph type
 * - CustomSelect dropdowns (Year selector, SuperAdmin Building switcher)
 * - Live search filtering for both member contributions & expense tables
 * - CSV Export via expo-sharing
 */
import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, ActivityIndicator, ScrollView, TouchableOpacity,
  Alert, Dimensions, RefreshControl, TextInput, StyleSheet,
} from 'react-native';
import Svg, { Rect, Text as SvgText, Line, G, Path } from 'react-native-svg';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import financeService from '../user_utils/services/financeService';
import buildingService from '../user_utils/services/buildingService';
import { useAuth } from '../user_utils/AuthContext';
import CustomSelect from './common/CustomSelect';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Inline SVG Bar Chart Component ──────────────────────────────────────────
const SvgBarChart = ({ data, barColor = '#0ea5e9', label = '' }) => {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.max(22, Math.floor((SCREEN_W - 80) / data.length) - 6);
  const chartHeight = 160;
  const svgWidth = Math.max(SCREEN_W - 48, data.length * (barWidth + 8) + 45);

  return (
    <View style={styles.chartCard}>
      {label && <Text style={styles.chartTitle}>{label}</Text>}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Svg width={svgWidth} height={chartHeight + 45}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const y = chartHeight - pct * chartHeight + 20;
            return (
              <G key={pct}>
                <Line x1="38" y1={y} x2={svgWidth} y2={y} stroke="#f1f5f9" strokeWidth="1.2" />
                <SvgText x="2" y={y + 3} fill="#94a3b8" fontSize="8" fontFamily="monospace">
                  {Math.round(maxVal * pct) >= 1000
                    ? `${(Math.round(maxVal * pct) / 1000).toFixed(0)}k`
                    : Math.round(maxVal * pct)}
                </SvgText>
              </G>
            );
          })}

          {/* Bars */}
          {data.map((d, i) => {
            const barH = (d.value / maxVal) * chartHeight;
            const x = 45 + i * (barWidth + 8);
            const y = chartHeight - barH + 20;
            return (
              <G key={i}>
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(barH, 3)}
                  fill={barColor}
                  rx="4"
                  opacity={d.value > 0 ? 0.9 : 0.2}
                />
                <SvgText
                  x={x + barWidth / 2}
                  y={chartHeight + 34}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="9.5"
                  fontWeight="600"
                >
                  {d.label}
                </SvgText>
                {d.value > 0 && (
                  <SvgText
                    x={x + barWidth / 2}
                    y={y - 5}
                    textAnchor="middle"
                    fill="#334155"
                    fontSize="7.5"
                    fontWeight="700"
                  >
                    ₹{d.value >= 1000 ? `${(d.value / 1000).toFixed(0)}k` : d.value}
                  </SvgText>
                )}
              </G>
            );
          })}
        </Svg>
      </ScrollView>
    </View>
  );
};

// ─── Inline SVG Donut Chart Component ────────────────────────────────────────
const SvgDonutChart = ({ data, title = '' }) => {
  if (!data || data.length === 0) return null;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const colors = ['#0ea5e9', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];
  let cumAngle = 0;

  const arcs = data.map((d, i) => {
    const pct = d.value / total;
    const startAngle = cumAngle;
    cumAngle += pct * 360;
    const endAngle = cumAngle;

    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;
    const largeArc = pct > 0.5 ? 1 : 0;
    const outerR = 75;
    const innerR = 48;

    const x1 = 90 + outerR * Math.cos(startRad);
    const y1 = 90 + outerR * Math.sin(startRad);
    const x2 = 90 + outerR * Math.cos(endRad);
    const y2 = 90 + outerR * Math.sin(endRad);
    const x3 = 90 + innerR * Math.cos(endRad);
    const y3 = 90 + innerR * Math.sin(endRad);
    const x4 = 90 + innerR * Math.cos(startRad);
    const y4 = 90 + innerR * Math.sin(startRad);

    const path = `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`;

    return { ...d, path, color: colors[i % colors.length], pct };
  });

  return (
    <View style={styles.chartCard}>
      {title && <Text style={styles.chartTitle}>{title}</Text>}
      <View style={{ alignItems: 'center', marginVertical: 8 }}>
        <Svg width="180" height="180" viewBox="0 0 180 180">
          {arcs.map((a, i) => (
            <Path key={i} d={a.path} fill={a.color} stroke="#ffffff" strokeWidth="2" />
          ))}
          <SvgText x="90" y="86" textAnchor="middle" fill="#0f172a" fontSize="13" fontWeight="800">
            ₹{total.toLocaleString('en-IN')}
          </SvgText>
          <SvgText x="90" y="102" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="600">
            Total Spent
          </SvgText>
        </Svg>
      </View>

      {/* Legend Chips */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 4 }}>
        {arcs.map((a, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#f8fafc', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' }}>
            <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: a.color }} />
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#334155' }}>{a.label}</Text>
            <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '700' }}>({(a.pct * 100).toFixed(0)}%)</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── KPI Card Sub-Component ──────────────────────────────────────────────────
const KpiCard = ({ label, value, emoji, colorScheme }) => {
  const schemes = {
    slate: { bg: '#f8fafc', border: '#e2e8f0', text: '#334155' },
    emerald: { bg: '#ecfdf5', border: '#a7f3d0', text: '#047857' },
    rose: { bg: '#fff1f2', border: '#fecdd3', text: '#be123c' },
    sky: { bg: '#f0f9ff', border: '#bae6fd', text: '#0369a1' },
  };
  const s = schemes[colorScheme] || schemes.slate;

  return (
    <View style={{
      flex: 1,
      backgroundColor: s.bg,
      borderWidth: 1.2,
      borderColor: s.border,
      borderRadius: 14,
      padding: 12,
      minWidth: '47%',
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 10, fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>{label}</Text>
        <Text style={{ fontSize: 16 }}>{emoji}</Text>
      </View>
      <Text style={{ fontSize: 15, fontWeight: '800', color: s.text, marginTop: 4 }}>
        ₹{(value || 0).toLocaleString('en-IN')}
      </Text>
    </View>
  );
};

// ─── Table Header Row ─────────────────────────────────────────────────────────
const TableHeaderRow = ({ cols }) => (
  <View style={{
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1.5,
    borderBottomColor: '#cbd5e1',
    paddingVertical: 9,
    paddingHorizontal: 4,
  }}>
    {cols.map((col, i) => (
      <Text
        key={i}
        style={{
          width: col.width,
          fontSize: 10.5,
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

// ─── Main FinancialSummary Screen Component ───────────────────────────────────
const FinancialSummary = () => {
  const { isSuperAdmin } = useAuth();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [expenseSearch, setExpenseSearch] = useState('');

  const yearOptions = Array.from({ length: 8 }, (_, i) => ({
    label: `FY ${currentYear - i}–${(currentYear - i + 1).toString().slice(-2)}`,
    value: currentYear - i,
  }));

  // Fetch buildings for SuperAdmin
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
      const responseData = await financeService.getSummary(selectedYear, bldgId ? { building_id: bldgId } : {});
      setData(responseData);
    } catch {
      Alert.alert('Error', 'Failed to fetch financial ledger data.');
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

  const getSpecialTitles = (d) => {
    const s = new Set();
    d?.members?.forEach((m) => Object.keys(m.special_income || {}).forEach((t) => s.add(t)));
    return Array.from(s);
  };

  const handleExport = async () => {
    if (!data) return;
    const months = data.months || [];
    const specialTitles = getSpecialTitles(data);

    let memberCsvHeader = ['Name', 'Flat', ...months, ...specialTitles, 'Total'].join(',');
    let memberCsvBody = (data.members || []).map((m) => {
      const monthVals = months.map((mon) => m.monthly?.[mon] || 0);
      const specialVals = specialTitles.map((t) => m.special_income?.[t] || 0);
      return [m.name, m.flat, ...monthVals, ...specialVals, m.total].join(',');
    }).join('\n');

    let expCsvHeader = ['Category', ...months, 'Total'].join(',');
    let expCsvBody = (data.expenses?.categories || []).map((c) => {
      return [c.category, ...months.map((mon) => c.monthly_expenses?.[mon] || 0), c.total_spent].join(',');
    }).join('\n');

    const csv = `Society Financial Summary — ${year}\n\nMember Contributions\n${memberCsvHeader}\n${memberCsvBody}\n\nExpenses by Category\n${expCsvHeader}\n${expCsvBody}`;
    // eslint-disable-next-line import/namespace
    const fileUri = FileSystem.documentDirectory + `Financial_Summary_${year}.csv`;
    try {
      // eslint-disable-next-line import/namespace
      await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: `Export ${year} Ledger` });
    } catch {
      Alert.alert('Export Error', 'Unable to export CSV file.');
    }
  };

  const months = data?.months || [];
  const specialTitles = getSpecialTitles(data);
  const totalIncome = data?.total_row?.total || 0;
  const totalExpense = data?.expenses?.total_expense || 0;
  const openingBalance = data?.opening_balance || 0;
  const netPosition = openingBalance + totalIncome - totalExpense;

  // Chart datasets
  const monthlyIncomeChartData = useMemo(() => {
    if (!data?.total_row?.monthly) return [];
    return months.map((m) => ({ label: m.slice(0, 3), value: data.total_row.monthly[m] || 0 }));
  }, [data, months]);

  const monthlyExpenseChartData = useMemo(() => {
    if (!data?.expenses?.total_monthly_expense) return [];
    return months.map((m) => ({ label: m.slice(0, 3), value: data.expenses.total_monthly_expense[m] || 0 }));
  }, [data, months]);

  const expenseDonutData = useMemo(() => {
    if (!data?.expenses?.categories) return [];
    return data.expenses.categories.map((c) => ({ label: c.category, value: c.total_spent || 0 }));
  }, [data]);

  // Filtered member rows
  const filteredMembers = useMemo(() => {
    if (!data?.members) return [];
    if (!memberSearch.trim()) return data.members;
    const q = memberSearch.toLowerCase();
    return data.members.filter((m) => m.name.toLowerCase().includes(q) || String(m.flat).toLowerCase().includes(q));
  }, [data, memberSearch]);

  // Filtered expense rows
  const filteredExpenseCategories = useMemo(() => {
    if (!data?.expenses?.categories) return [];
    if (!expenseSearch.trim()) return data.expenses.categories;
    const q = expenseSearch.toLowerCase();
    return data.expenses.categories.filter((c) => c.category.toLowerCase().includes(q));
  }, [data, expenseSearch]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f8fafc' }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284c7']} />}
    >
      {/* ── 1. Controls Header Bar ── */}
      <View style={styles.headerBar}>
        <View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>📊 Financial Summary</Text>
          <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Annual income, expenses & cash flow</Text>
        </View>
        <TouchableOpacity onPress={handleExport} style={styles.exportButton} activeOpacity={0.8}>
          <Ionicons name="share-outline" size={15} color="#059669" />
          <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#059669' }}>Export</Text>
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 14, gap: 14 }}>
        {/* ── Dropdown Selectors Bar ── */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <CustomSelect
              value={year}
              options={yearOptions}
              onValueChange={(val) => setYear(Number(val))}
              icon="calendar-outline"
              containerStyle={{ marginVertical: 0 }}
            />
          </View>

          {isSuperAdmin && buildings.length > 0 && (
            <View style={{ flex: 1 }}>
              <CustomSelect
                value={selectedBuilding}
                options={[
                  { label: 'All Buildings', value: '' },
                  ...buildings.map((b) => ({ label: b.name, value: String(b.id) })),
                ]}
                onValueChange={(val) => setSelectedBuilding(val)}
                icon="business-outline"
                containerStyle={{ marginVertical: 0 }}
              />
            </View>
          )}
        </View>

        {loading ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
            <ActivityIndicator size="large" color="#0284c7" />
            <Text style={{ color: '#64748b', marginTop: 12, fontSize: 13 }}>Calculating financial ledger...</Text>
          </View>
        ) : data ? (
          <>
            {/* ── 2. 4 KPI Summary Cards Grid ── */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <KpiCard label="Opening Balance" value={openingBalance} emoji="🏦" colorScheme="slate" />
              <KpiCard label="Total Income" value={totalIncome} emoji="📈" colorScheme="emerald" />
              <KpiCard label="Total Expenses" value={totalExpense} emoji="📉" colorScheme="rose" />
              <KpiCard label="Net Cash Position" value={netPosition} emoji="💎" colorScheme="sky" />
            </View>

            {/* ── 3. Member Contributions Table (ABOVE CHARTS MATCHING WEB) ── */}
            {data?.members && (
              <View style={{ marginTop: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={styles.sectionTitle}>💚 Member Contributions</Text>
                  <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '600' }}>{filteredMembers.length} members</Text>
                </View>

                {/* Search bar */}
                <View style={{ marginBottom: 8 }}>
                  <TextInput
                    value={memberSearch}
                    onChangeText={setMemberSearch}
                    placeholder="Search member or flat..."
                    placeholderTextColor="#94a3b8"
                    style={styles.tableSearchInput}
                  />
                </View>

                <View style={styles.tableCard}>
                  <ScrollView horizontal showsHorizontalScrollIndicator>
                    <View>
                      <TableHeaderRow cols={[
                        { label: 'Member', width: 130, align: 'left' },
                        { label: 'Flat', width: 60, align: 'left' },
                        ...months.map((m) => ({ label: m, width: 75, align: 'right' })),
                        ...specialTitles.map((t) => ({ label: t.slice(0, 12), width: 100, align: 'right' })),
                        { label: 'Total', width: 90, align: 'right' },
                      ]} />

                      {filteredMembers.map((m, idx) => (
                        <View key={idx} style={[styles.tableRow, { backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }]}>
                          <Text style={{ width: 130, fontSize: 11, color: '#1e293b', fontWeight: '700', paddingHorizontal: 4 }} numberOfLines={1}>{m.name}</Text>
                          <Text style={{ width: 60, fontSize: 11, color: '#64748b', paddingHorizontal: 4 }}>{m.flat}</Text>
                          {months.map((mon, i) => (
                            <Text key={i} style={{ width: 75, fontSize: 11, color: (m.monthly?.[mon] || 0) > 0 ? '#059669' : '#cbd5e1', textAlign: 'right', paddingHorizontal: 4 }}>
                              {(m.monthly?.[mon] || 0) > 0 ? `₹${m.monthly[mon]}` : '—'}
                            </Text>
                          ))}
                          {specialTitles.map((t, i) => (
                            <Text key={i} style={{ width: 100, fontSize: 11, color: (m.special_income?.[t] || 0) > 0 ? '#7c3aed' : '#cbd5e1', textAlign: 'right', paddingHorizontal: 4 }}>
                              {(m.special_income?.[t] || 0) > 0 ? `₹${m.special_income[t]}` : '—'}
                            </Text>
                          ))}
                          <Text style={{ width: 90, fontSize: 12, color: '#059669', fontWeight: '800', textAlign: 'right', paddingHorizontal: 4 }}>
                            ₹{(m.total || 0).toLocaleString('en-IN')}
                          </Text>
                        </View>
                      ))}

                      {/* Total Row */}
                      <View style={styles.tableTotalRow}>
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
              </View>
            )}

            {/* ── 4. Expenses by Category Table (ABOVE CHARTS MATCHING WEB) ── */}
            {data?.expenses?.categories && (
              <View style={{ marginTop: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={styles.sectionTitle}>❤️ Expenses by Category</Text>
                  <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '600' }}>{filteredExpenseCategories.length} categories</Text>
                </View>

                {/* Search bar */}
                <View style={{ marginBottom: 8 }}>
                  <TextInput
                    value={expenseSearch}
                    onChangeText={setExpenseSearch}
                    placeholder="Search category..."
                    placeholderTextColor="#94a3b8"
                    style={styles.tableSearchInput}
                  />
                </View>

                <View style={styles.tableCard}>
                  <ScrollView horizontal showsHorizontalScrollIndicator>
                    <View>
                      <TableHeaderRow cols={[
                        { label: 'Category', width: 150, align: 'left' },
                        ...months.map((m) => ({ label: m, width: 75, align: 'right' })),
                        { label: 'Total Spent', width: 100, align: 'right' },
                      ]} />

                      {filteredExpenseCategories.map((c, idx) => (
                        <View key={idx} style={[styles.tableRow, { backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }]}>
                          <Text style={{ width: 150, fontSize: 11, color: '#1e293b', fontWeight: '700', paddingHorizontal: 4 }} numberOfLines={1}>{c.category}</Text>
                          {months.map((mon, i) => (
                            <Text key={i} style={{ width: 75, fontSize: 11, color: (c.monthly_expenses?.[mon] || 0) > 0 ? '#e11d48' : '#cbd5e1', textAlign: 'right', paddingHorizontal: 4 }}>
                              {(c.monthly_expenses?.[mon] || 0) > 0 ? `₹${c.monthly_expenses[mon]}` : '—'}
                            </Text>
                          ))}
                          <Text style={{ width: 100, fontSize: 12, color: '#e11d48', fontWeight: '800', textAlign: 'right', paddingHorizontal: 4 }}>
                            ₹{(c.total_spent || 0).toLocaleString('en-IN')}
                          </Text>
                        </View>
                      ))}

                      {/* Total Row */}
                      <View style={styles.tableTotalRow}>
                        <Text style={{ width: 150, fontSize: 12, fontWeight: '800', color: '#0f172a', paddingHorizontal: 4 }}>TOTAL</Text>
                        {months.map((mon, i) => (
                          <Text key={i} style={{ width: 75, fontSize: 12, fontWeight: '800', color: '#0f172a', textAlign: 'right', paddingHorizontal: 4 }}>
                            ₹{data.expenses?.total_monthly_expense?.[mon] || 0}
                          </Text>
                        ))}
                        <Text style={{ width: 100, fontSize: 13, fontWeight: '900', color: '#e11d48', textAlign: 'right', paddingHorizontal: 4 }}>
                          ₹{(data.expenses?.total_expense || 0).toLocaleString('en-IN')}
                        </Text>
                      </View>
                    </View>
                  </ScrollView>
                </View>
              </View>
            )}

            {/* ── 5. CHARTS SECTION (STRICTLY BELOW TABLES MATCHING WEB ORDER) ── */}
            <View style={{ marginTop: 8, marginBottom: 30, gap: 14 }}>
              <SvgBarChart data={monthlyIncomeChartData} barColor="#10b981" label="📈 Monthly Income Collections" />
              <SvgBarChart data={monthlyExpenseChartData} barColor="#f43f5e" label="📉 Monthly Expense Outflows" />

              {expenseDonutData.length > 0 && (
                <SvgDonutChart data={expenseDonutData} title="🍩 Expense Category Breakdown" />
              )}
            </View>
          </>
        ) : null}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  tableSearchInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 12.5,
    color: '#0f172a',
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableTotalRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 4,
    backgroundColor: '#f0f9ff',
    borderTopWidth: 2,
    borderTopColor: '#bae6fd',
  },
});

export default FinancialSummary;