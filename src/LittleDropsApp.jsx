import React, { useState, useEffect } from 'react';
import { Heart, Droplet, Baby, Clock, Thermometer, Scissors, Calculator, RotateCcw, Info, Flame, AlertTriangle, Zap, HelpCircle, Download, FileText } from 'lucide-react';

const LittleDropsApp = () => {
  const [patientData, setPatientData] = useState({
    age: '',
    weight: '',
    temperature: 37,
    npoTime: '',
    preOpFluid: 0,
    surgeryDuration: 1,
    bloodLoss: {},
    isBurn: false,
    tbsaBurn: '',
    burnTimeframe: '8hours',
    calculateDehydration: false,
    dehydrationLevel: 'mild',
    dehydrationTimeframe: '8hours',
    calculateThirdSpace: false,
    thirdSpaceLevel: 'minimal',
    calculateEvaporation: false,
    evaporationLevel: 'minor',
    evaporationMajorLevel: 'medium',
    feverTemperature: 38,
    calculateFeverLoss: false
  });

  const [results, setResults] = useState(null);
  const [showSparkles, setShowSparkles] = useState(false);
  const [bounce, setBounce] = useState(false);
  const [showDehydrationInfo, setShowDehydrationInfo] = useState(false);
  const [showEvaporationInfo, setShowEvaporationInfo] = useState(false);
  const [showFeverInfo, setShowFeverInfo] = useState(false);

  useEffect(() => {
    const bounceInterval = setInterval(() => setBounce(true), 3000);
    return () => clearInterval(bounceInterval);
  }, []);

  const calculateFluid = () => {
    const weight = parseFloat(patientData.weight);
    const npoTime = parseFloat(patientData.npoTime);
    const preOpFluid = parseFloat(patientData.preOpFluid) || 0;
    const surgeryHours = parseInt(patientData.surgeryDuration);
    const temp = parseFloat(patientData.temperature);

    if (!weight || !npoTime || !surgeryHours) return;

    // Maintenance fluid calculation (Holliday-Segar method)
    let maintenanceFluid = 0;
    let maintenanceFormula = '';
    if (weight <= 10) {
      maintenanceFluid = weight * 4;
      maintenanceFormula = `${weight} kg × 4 = ${Math.round(maintenanceFluid)} mL/hr`;
    } else if (weight <= 20) {
      maintenanceFluid = 40 + (weight - 10) * 2;
      maintenanceFormula = `40 + (${weight} - 10) × 2 = ${Math.round(maintenanceFluid)} mL/hr`;
    } else {
      maintenanceFluid = 60 + (weight - 20) * 1;
      maintenanceFormula = `60 + (${weight} - 20) × 1 = ${Math.round(maintenanceFluid)} mL/hr`;
    }

    // Deficit calculation (4-2-1 rule)
    const totalDeficit = Math.max(0, maintenanceFluid * npoTime - preOpFluid);
    const deficitHour1 = totalDeficit * 0.5;
    const deficitHour2 = totalDeficit * 0.25;
    const deficitHour3 = totalDeficit * 0.25;
    const deficitFormula = `(${Math.round(maintenanceFluid)} × ${npoTime} - ${preOpFluid}) = ${Math.round(totalDeficit)} mL รวม`;

    // Burn fluid calculation (Parkland formula modified for pediatrics)
    let burnFluid = 0;
    let burnFormula = '';
    if (patientData.isBurn && patientData.tbsaBurn) {
      const tbsa = parseFloat(patientData.tbsaBurn);
      const totalBurnFluid = 4 * weight * tbsa;
      if (patientData.burnTimeframe === '8hours') {
        burnFluid = totalBurnFluid * 0.5 / 8;
        burnFormula = `4 × ${weight} × ${tbsa}% × 50% ÷ 8 = ${Math.round(burnFluid)} mL/hr (8 ชม.แรก)`;
      } else {
        burnFluid = totalBurnFluid * 0.5 / 16;
        burnFormula = `4 × ${weight} × ${tbsa}% × 50% ÷ 16 = ${Math.round(burnFluid)} mL/hr (16 ชม.ถัดไป)`;
      }
    }

    // Dehydration fluid calculation
    let dehydrationFluid = 0;
    let dehydrationFormula = '';
    if (!patientData.isBurn && patientData.calculateDehydration) {
      const dehydrationRates = { 
        mild: 50,    // 3-5% body weight loss
        moderate: 100, // 6-9% body weight loss
        severe: 150   // 10-15% body weight loss
      };
      const totalDehydrationFluid = weight * dehydrationRates[patientData.dehydrationLevel];
      const timeframe = patientData.dehydrationTimeframe === '8hours' ? 8 : 16;
      dehydrationFluid = totalDehydrationFluid / timeframe;
      dehydrationFormula = `${weight} kg × ${dehydrationRates[patientData.dehydrationLevel]} mL/kg ÷ ${timeframe} ชม. = ${Math.round(dehydrationFluid)} mL/hr`;
    }

    // Third space loss calculation
    let thirdSpaceFluid = 0;
    let thirdSpaceFormula = '';
    if (!patientData.isBurn && patientData.calculateThirdSpace) {
      const rates = { 
        minimal: 3,  // Minor surgery
        moderate: 5, // Moderate surgery
        major: 8     // Major surgery
      };
      thirdSpaceFluid = weight * rates[patientData.thirdSpaceLevel];
      thirdSpaceFormula = `${weight} kg × ${rates[patientData.thirdSpaceLevel]} = ${Math.round(thirdSpaceFluid)} mL/hr`;
    }

    // Evaporation loss calculation (based on surgical exposure)
    let evaporationFluid = 0;
    let evaporationFormula = '';
    if (!patientData.isBurn && patientData.calculateEvaporation) {
      const evaporationRates = { 
        minor: 1.5,      // Grade 1: 1-2 mL/kg/hr - minimal tissue exposure
        moderate: 6,     // Grade 2: 4-8 mL/kg/hr - partial organ exposure
        major: patientData.evaporationMajorLevel === 'low' ? 9 :
               patientData.evaporationMajorLevel === 'medium' ? 12.5 : 17.5  // Grade 3: 8-10, 10-15, 15-20 mL/kg/hr
      };
      evaporationFluid = weight * evaporationRates[patientData.evaporationLevel];
      
      if (patientData.evaporationLevel === 'major') {
        const majorLabels = {
          low: '8-10 mL/kg/hr',
          medium: '10-15 mL/kg/hr', 
          high: '15-20 mL/kg/hr'
        };
        evaporationFormula = `${weight} kg × ${evaporationRates[patientData.evaporationLevel]} mL/kg/hr (${majorLabels[patientData.evaporationMajorLevel]}) = ${Math.round(evaporationFluid)} mL/hr`;
      } else {
        evaporationFormula = `${weight} kg × ${evaporationRates[patientData.evaporationLevel]} mL/kg/hr = ${Math.round(evaporationFluid)} mL/hr`;
      }
    }

    // Fever-related fluid loss calculation
    let feverFluid = 0;
    let feverFormula = '';
    if (!patientData.isBurn && patientData.calculateFeverLoss && temp > 37) {
      const temperatureDiff = temp - 37;
      feverFluid = maintenanceFluid * 0.1 * temperatureDiff; // 10% increase per 1°C above 37°C
      feverFormula = `${Math.round(maintenanceFluid)} × 10% × (${temp} - 37) = ${Math.round(feverFluid)} mL/hr`;
    }

    // Blood loss replacement calculation (3:1 rule)
    const bloodLossReplacement = {};
    const bloodLossFormulas = {};
    Object.keys(patientData.bloodLoss).forEach(hour => {
      const loss = parseFloat(patientData.bloodLoss[hour]) || 0;
      bloodLossReplacement[hour] = loss * 3;
      bloodLossFormulas[hour] = `${loss} mL × 3 = ${Math.round(loss * 3)} mL/hr`;
    });

    // Hourly calculations
    const hourlyResults = {};
    for (let hour = 1; hour <= surgeryHours; hour++) {
      let deficitForHour = 0;
      let deficitHourlyFormula = '';
      
      if (hour === 1) {
        deficitForHour = deficitHour1;
        deficitHourlyFormula = `50% ของ ${Math.round(totalDeficit)} = ${Math.round(deficitHour1)} mL/hr`;
      } else if (hour === 2) {
        deficitForHour = deficitHour2;
        deficitHourlyFormula = `25% ของ ${Math.round(totalDeficit)} = ${Math.round(deficitHour2)} mL/hr`;
      } else if (hour === 3) {
        deficitForHour = deficitHour3;
        deficitHourlyFormula = `25% ของ ${Math.round(totalDeficit)} = ${Math.round(deficitHour3)} mL/hr`;
      } else {
        deficitForHour = 0;
        deficitHourlyFormula = 'ให้ครบแล้วในชั่วโมงแรก';
      }

      const bloodReplacement = bloodLossReplacement[hour] || 0;
      const total = maintenanceFluid + deficitForHour + burnFluid + dehydrationFluid + thirdSpaceFluid + evaporationFluid + feverFluid + bloodReplacement;
      
      hourlyResults[hour] = {
        maintenance: maintenanceFluid,
        deficit: deficitForHour,
        burn: burnFluid,
        dehydration: dehydrationFluid,
        thirdSpace: thirdSpaceFluid,
        evaporation: evaporationFluid,
        fever: feverFluid,
        bloodLoss: bloodReplacement,
        total: total,
        deficitFormula: deficitHourlyFormula,
        bloodLossFormula: bloodLossFormulas[hour] || 'ไม่มีการเสียเลือด'
      };
    }

    setResults({
      maintenanceFluid,
      maintenanceFormula,
      totalDeficit,
      deficitFormula,
      burnFluid,
      burnFormula,
      dehydrationFluid,
      dehydrationFormula,
      thirdSpaceFluid,
      thirdSpaceFormula,
      evaporationFluid,
      evaporationFormula,
      feverFluid,
      feverFormula,
      hourlyResults
    });

    setShowSparkles(true);
    setTimeout(() => setShowSparkles(false), 2000);
  };

  const resetForm = () => {
    setPatientData({
      age: '',
      weight: '',
      temperature: 37,
      npoTime: '',
      preOpFluid: 0,
      surgeryDuration: 1,
      bloodLoss: {},
      isBurn: false,
      tbsaBurn: '',
      burnTimeframe: '8hours',
      calculateDehydration: false,
      dehydrationLevel: 'mild',
      dehydrationTimeframe: '8hours',
      calculateThirdSpace: false,
      thirdSpaceLevel: 'minimal',
      calculateEvaporation: false,
      evaporationLevel: 'minor',
      evaporationMajorLevel: 'medium',
      feverTemperature: 38,
      calculateFeverLoss: false
    });
    setResults(null);
  };

  const exportResults = () => {
    if (!results) return;
    
    const reportData = {
      patientInfo: {
        age: patientData.age,
        weight: patientData.weight,
        temperature: patientData.temperature
      },
      calculations: results,
      timestamp: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `little-drops-calculation-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const dehydrationLevels = [
    { 
      key: 'mild', 
      label: 'Mild (50 mL/kg)', 
      description: '3-5% น้ำหนัก: กระหายน้ำ เยื่อบุปากแห้ง ตาไม่บุ๋ม',
      rate: 50,
      percentage: '3-5%'
    },
    { 
      key: 'moderate', 
      label: 'Moderate (100 mL/kg)', 
      description: '6-9% น้ำหนัก: ตาบุ๋ม เยื่อบุปากแห้งมาก น้ำหนักลด',
      rate: 100,
      percentage: '6-9%'
    },
    { 
      key: 'severe', 
      label: 'Severe (150 mL/kg)', 
      description: '10-15% น้ำหนัก: ตาบุ๋มมาก ผิวหนังยืดช้า ความดันลด',
      rate: 150,
      percentage: '10-15%'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-pink-200">
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className={`text-5xl ${bounce ? 'animate-bounce' : ''}`} 
                   onAnimationEnd={() => setBounce(false)}>
                💧
              </div>
              <div className="absolute -top-2 -right-2 text-xl animate-pulse text-pink-400">💧</div>
              <div className="absolute -bottom-2 -left-2 text-xl animate-pulse">✨</div>
            </div>
            <h1 className="text-4xl font-bold text-pink-600 mb-2 flex items-center justify-center">
              Little Drops <span className="text-blue-500 ml-2">💧</span>
            </h1>
            <p className="text-lg text-pink-500 mb-2">ลิตเติ้ล ดรอปส์ - เครื่องคำนวณสารน้ำสำหรับเด็ก</p>
            <p className="text-sm text-gray-600">Pediatric Intraoperative Fluid Calculator</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="space-y-6">
              {/* Patient Information */}
              <div className="bg-pink-50 p-4 rounded-xl border border-pink-200">
                <h2 className="text-xl font-bold text-pink-600 mb-4 flex items-center">
                  <span className="text-2xl mr-2">👶</span>
                  ข้อมูลเจ้าตัวน้อย
                  <span className="text-2xl ml-2">🌈</span>
                </h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center space-x-2 text-pink-600 font-semibold mb-2">
                        <span className="text-lg">🎂</span>
                        <span>อายุ (ปี)</span>
                      </label>
                      <input
                        type="number"
                        value={patientData.age}
                        onChange={(e) => setPatientData({...patientData, age: e.target.value})}
                        className="w-full p-3 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
                        placeholder="ใส่อายุ..."
                      />
                    </div>
                    
                    <div>
                      <label className="flex items-center space-x-2 text-pink-600 font-semibold mb-2">
                        <span className="text-lg">❤️</span>
                        <span>น้ำหนัก (kg)</span>
                      </label>
                      <input
                        type="number"
                        value={patientData.weight}
                        onChange={(e) => setPatientData({...patientData, weight: e.target.value})}
                        className="w-full p-3 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
                        placeholder="ใส่น้ำหนัก..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center space-x-2 text-pink-600 font-semibold mb-2">
                      <Thermometer className="text-red-500" size={18} />
                      <span>อุณหภูมิปัจจุบัน (°C)</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={patientData.temperature}
                      onChange={(e) => setPatientData({...patientData, temperature: e.target.value})}
                      className="w-full p-3 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
                      placeholder="37.0"
                    />
                  </div>
                </div>
              </div>

              {/* Surgery Information */}
              <div className="bg-pink-50 p-4 rounded-xl border border-pink-200">
                <h2 className="text-xl font-bold text-pink-600 mb-4 flex items-center">
                  <span className="text-2xl mr-2">⏰</span>
                  ข้อมูลผ่าตัด
                </h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center space-x-2 text-pink-600 font-semibold mb-2">
                        <Clock className="text-pink-500" size={18} />
                        <span>NPO Time (ชม.)</span>
                      </label>
                      <input
                        type="number"
                        value={patientData.npoTime}
                        onChange={(e) => setPatientData({...patientData, npoTime: e.target.value})}
                        className="w-full p-3 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
                        placeholder="ชั่วโมง..."
                      />
                    </div>
                    
                    <div>
                      <label className="flex items-center space-x-2 text-pink-600 font-semibold mb-2">
                        <Droplet className="text-pink-500" size={18} />
                        <span>สารน้ำก่อนผ่าตัด (mL)</span>
                      </label>
                      <input
                        type="number"
                        value={patientData.preOpFluid}
                        onChange={(e) => setPatientData({...patientData, preOpFluid: e.target.value})}
                        className="w-full p-3 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
                        placeholder="mL..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center space-x-2 text-pink-600 font-semibold mb-3">
                      <Scissors className="text-pink-500" size={18} />
                      <span>ระยะเวลาผ่าตัด</span>
                    </label>
                    <div className="grid grid-cols-6 gap-2">
                      {[1, 2, 3, 4, 5, 6].map(hour => (
                        <button
                          key={hour}
                          onClick={() => setPatientData({...patientData, surgeryDuration: hour})}
                          className={`p-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                            patientData.surgeryDuration === hour
                              ? 'bg-pink-500 text-white'
                              : 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                          }`}
                        >
                          {hour}h
                        </button>
                      ))}
                    </div>
                  </div>

                  {patientData.surgeryDuration && (
                    <div>
                      <label className="flex items-center space-x-2 text-pink-600 font-semibold mb-3">
                        <span className="text-lg">🩸</span>
                        <span>ปริมาณเสียเลือดแต่ละชั่วโมง (mL)</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {Array.from({length: patientData.surgeryDuration}, (_, i) => (
                          <div key={i}>
                            <label className="text-xs text-pink-600 mb-1 block">ชั่วโมงที่ {i + 1}</label>
                            <input
                              type="number"
                              value={patientData.bloodLoss[i + 1] || ''}
                              onChange={(e) => setPatientData({
                                ...patientData,
                                bloodLoss: {...patientData.bloodLoss, [i + 1]: e.target.value}
                              })}
                              className="w-full p-2 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm"
                              placeholder="mL"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Special Conditions */}
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-xl border border-pink-200">
                <h2 className="text-xl font-bold text-pink-600 mb-4 flex items-center">
                  <span className="text-2xl mr-2">✨</span>
                  สภาวะพิเศษที่ต้องพิจารณา
                  <span className="text-2xl ml-2">🦄</span>
                </h2>
                
                <div className="space-y-6">
                  {/* Burn Patient */}
                  <div className="bg-white p-4 rounded-lg border border-pink-200">
                    <label className="flex items-center space-x-3 text-pink-600 font-semibold mb-3">
                      <Flame className="text-orange-500" size={20} />
                      <span>เป็นผู้ป่วย Burn?</span>
                    </label>
                    <div className="flex space-x-4 mb-4">
                      <button
                        onClick={() => setPatientData({...patientData, isBurn: false})}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                          !patientData.isBurn ? 'bg-pink-500 text-white' : 'bg-pink-100 text-pink-600'
                        }`}
                      >
                        ไม่
                      </button>
                      <button
                        onClick={() => setPatientData({...patientData, isBurn: true})}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                          patientData.isBurn ? 'bg-orange-500 text-white' : 'bg-pink-100 text-pink-600'
                        }`}
                      >
                        ใช่
                      </button>
                    </div>
                    
                    {patientData.isBurn && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm text-pink-600 font-semibold mb-2 block">% TBSA Burn:</label>
                          <input
                            type="number"
                            value={patientData.tbsaBurn}
                            onChange={(e) => setPatientData({...patientData, tbsaBurn: e.target.value})}
                            className="w-full p-2 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
                            placeholder="% TBSA"
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm text-pink-600 font-semibold mb-2 block">ช่วงเวลา:</label>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setPatientData({...patientData, burnTimeframe: '8hours'})}
                              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                patientData.burnTimeframe === '8hours' ? 'bg-orange-500 text-white' : 'bg-pink-100 text-pink-600'
                              }`}
                            >
                              8 ชม.แรก
                            </button>
                            <button
                              onClick={() => setPatientData({...patientData, burnTimeframe: '16hours'})}
                              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                patientData.burnTimeframe === '16hours' ? 'bg-orange-500 text-white' : 'bg-pink-100 text-pink-600'
                              }`}
                            >
                              16 ชม.ถัดไป
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Non-burn conditions */}
                  {!patientData.isBurn && (
                    <div className="space-y-4">
                      {/* Dehydration */}
                      <div className="bg-white p-4 rounded-lg border border-pink-200">
                        <div className="flex items-center justify-between mb-3">
                          <label className="flex items-center space-x-3 text-pink-600 font-semibold">
                            <Droplet className="text-blue-500" size={20} />
                            <span>ต้องการคำนวณ Dehydration?</span>
                          </label>
                          <button
                            onClick={() => setShowDehydrationInfo(!showDehydrationInfo)}
                            className="text-blue-500 hover:bg-blue-50 p-1 rounded"
                          >
                            <HelpCircle size={16} />
                          </button>
                        </div>

                        {showDehydrationInfo && (
                          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <h4 className="font-semibold text-blue-700 mb-2">ระดับ Dehydration:</h4>
                            {dehydrationLevels.map(level => (
                              <div key={level.key} className="mb-2">
                                <span className="font-semibold text-blue-600">{level.label}:</span>
                                <p className="text-sm text-blue-700">{level.description}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex space-x-4 mb-4">
                          <button
                            onClick={() => setPatientData({...patientData, calculateDehydration: false})}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                              !patientData.calculateDehydration ? 'bg-pink-500 text-white' : 'bg-pink-100 text-pink-600'
                            }`}
                          >
                            ไม่
                          </button>
                          <button
                            onClick={() => setPatientData({...patientData, calculateDehydration: true})}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                              patientData.calculateDehydration ? 'bg-blue-500 text-white' : 'bg-pink-100 text-pink-600'
                            }`}
                          >
                            ใช่
                          </button>
                        </div>
                        
                        {patientData.calculateDehydration && (
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm text-pink-600 font-semibold mb-2 block">ระดับ Dehydration:</label>
                              <div className="space-y-2">
                                {dehydrationLevels.map(level => (
                                  <button
                                    key={level.key}
                                    onClick={() => setPatientData({...patientData, dehydrationLevel: level.key})}
                                    className={`w-full p-3 text-left rounded-lg border transition-all duration-200 ${
                                      patientData.dehydrationLevel === level.key 
                                        ? 'bg-blue-500 text-white border-blue-500' 
                                        : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                    }`}
                                  >
                                    <div className="font-semibold">{level.label}</div>
                                    <div className="text-xs opacity-90">{level.description}</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-sm text-pink-600 font-semibold mb-2 block">ช่วงเวลาการให้:</label>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => setPatientData({...patientData, dehydrationTimeframe: '8hours'})}
                                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                    patientData.dehydrationTimeframe === '8hours' ? 'bg-blue-500 text-white' : 'bg-pink-100 text-pink-600'
                                  }`}
                                >
                                  8 ชม.
                                </button>
                                <button
                                  onClick={() => setPatientData({...patientData, dehydrationTimeframe: '16hours'})}
                                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                    patientData.dehydrationTimeframe === '16hours' ? 'bg-blue-500 text-white' : 'bg-pink-100 text-pink-600'
                                  }`}
                                >
                                  16 ชม.
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Third Space Loss */}
                      <div className="bg-white p-4 rounded-lg border border-pink-200">
                        <label className="flex items-center space-x-3 text-pink-600 font-semibold mb-3">
                          <AlertTriangle className="text-yellow-500" size={20} />
                          <span>ต้องการคำนวณ Third Space Loss?</span>
                        </label>
                        <div className="flex space-x-4 mb-4">
                          <button
                            onClick={() => setPatientData({...patientData, calculateThirdSpace: false})}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                              !patientData.calculateThirdSpace ? 'bg-pink-500 text-white' : 'bg-pink-100 text-pink-600'
                            }`}
                          >
                            ไม่
                          </button>
                          <button
                            onClick={() => setPatientData({
                              ...patientData, 
                              calculateThirdSpace: true,
                              calculateEvaporation: false // ปิด evaporation เมื่อเลือก third space
                            })}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                              patientData.calculateThirdSpace ? 'bg-yellow-500 text-white' : 'bg-pink-100 text-pink-600'
                            }`}
                          >
                            ใช่
                          </button>
                        </div>
                        
                        {patientData.calculateThirdSpace && (
                          <div>
                            <label className="text-sm text-pink-600 font-semibold mb-2 block">ระดับการผ่าตัด:</label>
                            <div className="space-y-2">
                              {[
                                { key: 'minimal', label: 'Minor Surgery (3 mL/kg/hr)', desc: 'การผ่าตัดเล็กน้อย' },
                                { key: 'moderate', label: 'Moderate Surgery (5 mL/kg/hr)', desc: 'การผ่าตัดปานกลาง' },
                                { key: 'major', label: 'Major Surgery (8 mL/kg/hr)', desc: 'การผ่าตัดใหญ่' }
                              ].map(level => (
                                <button
                                  key={level.key}
                                  onClick={() => setPatientData({...patientData, thirdSpaceLevel: level.key})}
                                  className={`w-full p-3 text-left rounded-lg border transition-all duration-200 ${
                                    patientData.thirdSpaceLevel === level.key 
                                      ? 'bg-yellow-500 text-white border-yellow-500' 
                                      : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
                                  }`}
                                >
                                  <div className="font-semibold">{level.label}</div>
                                  <div className="text-xs opacity-90">{level.desc}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Evaporation Loss */}
                      <div className="bg-white p-4 rounded-lg border border-pink-200">
                        <div className="flex items-center justify-between mb-3">
                          <label className="flex items-center space-x-3 text-pink-600 font-semibold">
                            <Zap className="text-purple-500" size={20} />
                            <span>ต้องการคำนวณ Evaporation Loss?</span>
                          </label>
                          <button
                            onClick={() => setShowEvaporationInfo(!showEvaporationInfo)}
                            className="text-purple-500 hover:bg-purple-50 p-1 rounded"
                          >
                            <HelpCircle size={16} />
                          </button>
                        </div>

                        {showEvaporationInfo && (
                          <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                            <h4 className="font-semibold text-purple-700 mb-2">ระดับการสูญเสียน้ำจากการระเหย (Evidence-based):</h4>
                            <div className="space-y-2 text-sm text-purple-700">
                              <div>
                                <span className="font-semibold">Grade 1 - Minor (1-2 mL/kg/hr):</span>
                                <p className="ml-4 text-xs">การผ่าตัดแผลเล็ก, การเปิดแผลน้อย เช่น hernia repair</p>
                              </div>
                              <div>
                                <span className="font-semibold">Grade 2 - Moderate (4-8 mL/kg/hr):</span>
                                <p className="ml-4 text-xs">การเปิดช่องท้องบางส่วน, การเปิดอวัยวะปานกลาง เช่น appendectomy</p>
                              </div>
                              <div>
                                <span className="font-semibold">Grade 3 - Major (10-20 mL/kg/hr):</span>
                                <p className="ml-4 text-xs">การเปิดช่องท้องใหญ่, ลำไส้นอกตัว, การผ่าตัดช่องท้อง/หน้าอกใหญ่</p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex space-x-4 mb-4">
                          <button
                            onClick={() => setPatientData({...patientData, calculateEvaporation: false})}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                              !patientData.calculateEvaporation ? 'bg-pink-500 text-white' : 'bg-pink-100 text-pink-600'
                            }`}
                          >
                            ไม่
                          </button>
                          <button
                            onClick={() => setPatientData({
                              ...patientData, 
                              calculateEvaporation: true,
                              calculateThirdSpace: false // ปิด third space เมื่อเลือก evaporation
                            })}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                              patientData.calculateEvaporation ? 'bg-purple-500 text-white' : 'bg-pink-100 text-pink-600'
                            }`}
                          >
                            ใช่
                          </button>
                        </div>
                        
                        {patientData.calculateEvaporation && (
                          <div>
                            <label className="text-sm text-pink-600 font-semibold mb-2 block">ระดับการเปิดแผล (Evidence-based Grading):</label>
                            <div className="space-y-2">
                              {[
                                { 
                                  key: 'minor', 
                                  label: 'Grade 1 - Minor (1-2 mL/kg/hr)', 
                                  desc: 'การผ่าตัดแผลเล็ก, การเปิดแผลน้อย เช่น hernia repair',
                                  rate: 1.5
                                },
                                { 
                                  key: 'moderate', 
                                  label: 'Grade 2 - Moderate (4-8 mL/kg/hr)', 
                                  desc: 'การเปิดช่องท้องบางส่วน, การเปิดอวัยวะปานกลาง เช่น appendectomy',
                                  rate: 6
                                }
                              ].map(level => (
                                <button
                                  key={level.key}
                                  onClick={() => setPatientData({...patientData, evaporationLevel: level.key})}
                                  className={`w-full p-3 text-left rounded-lg border transition-all duration-200 ${
                                    patientData.evaporationLevel === level.key 
                                      ? 'bg-purple-500 text-white border-purple-500' 
                                      : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                                  }`}
                                >
                                  <div className="font-semibold">{level.label}</div>
                                  <div className="text-xs opacity-90">{level.desc}</div>
                                </button>
                              ))}
                              
                              {/* Major Category with Sub-options */}
                              <div className="border rounded-lg border-purple-200 bg-purple-50">
                                <button
                                  onClick={() => {
                                    if (patientData.evaporationLevel === 'major') {
                                      setPatientData({...patientData, evaporationLevel: 'minor'});
                                    } else {
                                      setPatientData({...patientData, evaporationLevel: 'major', evaporationMajorLevel: 'medium'});
                                    }
                                  }}
                                  className={`w-full p-3 text-left rounded-t-lg transition-all duration-200 ${
                                    patientData.evaporationLevel === 'major'
                                      ? 'bg-purple-500 text-white' 
                                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                                  }`}
                                >
                                  <div className="font-semibold">Grade 3 - Major (10-20 mL/kg/hr)</div>
                                  <div className="text-xs opacity-90">การเปิดช่องท้องใหญ่, ลำไส้นอกตัว, การผ่าตัดช่องท้อง/หน้าอกใหญ่</div>
                                </button>
                                
                                {patientData.evaporationLevel === 'major' && (
                                  <div className="p-3 space-y-2 bg-white border-t border-purple-200">
                                    <label className="text-xs text-purple-600 font-semibold block">เลือกระดับ Major:</label>
                                    <div className="grid grid-cols-1 gap-2">
                                      {[
                                        { key: 'low', label: '8-10 mL/kg/hr', desc: 'Major surgery - Low complexity', rate: 9 },
                                        { key: 'medium', label: '10-15 mL/kg/hr', desc: 'Major surgery - Medium complexity', rate: 12.5 },
                                        { key: 'high', label: '15-20 mL/kg/hr', desc: 'Major surgery - High complexity', rate: 17.5 }
                                      ].map(subLevel => (
                                        <button
                                          key={subLevel.key}
                                          onClick={() => setPatientData({
                                            ...patientData, 
                                            evaporationLevel: 'major',
                                            evaporationMajorLevel: subLevel.key
                                          })}
                                          className={`w-full p-2 text-left rounded border text-sm transition-all duration-200 ${
                                            patientData.evaporationMajorLevel === subLevel.key
                                              ? 'bg-purple-600 text-white border-purple-600' 
                                              : 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200'
                                          }`}
                                        >
                                          <div className="font-semibold">{subLevel.label}</div>
                                          <div className="text-xs opacity-90">{subLevel.desc}</div>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Fever-related Loss */}
                      <div className="bg-white p-4 rounded-lg border border-pink-200">
                        <div className="flex items-center justify-between mb-3">
                          <label className="flex items-center space-x-3 text-pink-600 font-semibold">
                            <Thermometer className="text-red-500" size={20} />
                            <span>ต้องการคำนวณการสูญเสียจากไข้?</span>
                          </label>
                          <button
                            onClick={() => setShowFeverInfo(!showFeverInfo)}
                            className="text-red-500 hover:bg-red-50 p-1 rounded"
                          >
                            <HelpCircle size={16} />
                          </button>
                        </div>

                        {showFeverInfo && (
                          <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                            <h4 className="font-semibold text-red-700 mb-2">การสูญเสียน้ำจากไข้:</h4>
                            <p className="text-sm text-red-700">
                              เพิ่มขึ้น 10% ของ maintenance fluid ทุกๆ 1°C ที่สูงกว่า 37°C
                            </p>
                          </div>
                        )}

                        <div className="flex space-x-4 mb-4">
                          <button
                            onClick={() => setPatientData({...patientData, calculateFeverLoss: false})}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                              !patientData.calculateFeverLoss ? 'bg-pink-500 text-white' : 'bg-pink-100 text-pink-600'
                            }`}
                          >
                            ไม่
                          </button>
                          <button
                            onClick={() => setPatientData({...patientData, calculateFeverLoss: true})}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                              patientData.calculateFeverLoss ? 'bg-red-500 text-white' : 'bg-pink-100 text-pink-600'
                            }`}
                          >
                            ใช่
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={calculateFluid}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-pink-600 hover:to-purple-600 transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg"
                >
                  <Calculator size={24} />
                  <span>คำนวณสารน้ำ</span>
                  {showSparkles && <span className="animate-pulse">✨</span>}
                </button>
                
                <button
                  onClick={resetForm}
                  className="bg-gray-400 text-white py-4 px-6 rounded-xl font-bold hover:bg-gray-500 transition-all duration-300 flex items-center justify-center"
                >
                  <RotateCcw size={20} />
                </button>
              </div>
            </div>

            {/* Results Section */}
            <div className="space-y-6">
              {results ? (
                <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-green-600 flex items-center">
                      <span className="text-2xl mr-2">🎉</span>
                      ผลการคำนวณ
                      <span className="text-2xl ml-2">💧</span>
                    </h2>
                    <button
                      onClick={exportResults}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all duration-200 flex items-center space-x-2"
                    >
                      <Download size={16} />
                      <span>Export</span>
                    </button>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg border border-green-200">
                      <h3 className="font-semibold text-green-600 mb-2 flex items-center">
                        <Heart className="text-pink-500 mr-2" size={16} />
                        Maintenance Fluid
                      </h3>
                      <p className="text-2xl font-bold text-green-700">{Math.round(results.maintenanceFluid)} mL/hr</p>
                      <p className="text-xs text-gray-600 mt-1">{results.maintenanceFormula}</p>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-blue-600 mb-2 flex items-center">
                        <Droplet className="text-blue-500 mr-2" size={16} />
                        Total Deficit
                      </h3>
                      <p className="text-2xl font-bold text-blue-700">{Math.round(results.totalDeficit)} mL</p>
                      <p className="text-xs text-gray-600 mt-1">{results.deficitFormula}</p>
                    </div>
                  </div>

                  {/* Special Conditions Results */}
                  {(results.burnFluid > 0 || results.dehydrationFluid > 0 || results.thirdSpaceFluid > 0 || results.evaporationFluid > 0 || results.feverFluid > 0) && (
                    <div className="bg-white p-4 rounded-lg border border-purple-200 mb-6">
                      <h3 className="font-semibold text-purple-600 mb-3 flex items-center">
                        <span className="text-lg mr-2">✨</span>
                        สภาวะพิเศษ
                      </h3>
                      <div className="space-y-2 text-sm">
                        {results.burnFluid > 0 && (
                          <div className="flex justify-between">
                            <span className="text-orange-600">🔥 Burn Fluid:</span>
                            <span className="font-semibold">{Math.round(results.burnFluid)} mL/hr</span>
                          </div>
                        )}
                        {results.dehydrationFluid > 0 && (
                          <div className="flex justify-between">
                            <span className="text-blue-600">💧 Dehydration:</span>
                            <span className="font-semibold">{Math.round(results.dehydrationFluid)} mL/hr</span>
                          </div>
                        )}
                        {results.thirdSpaceFluid > 0 && (
                          <div className="flex justify-between">
                            <span className="text-yellow-600">⚠️ Third Space:</span>
                            <span className="font-semibold">{Math.round(results.thirdSpaceFluid)} mL/hr</span>
                          </div>
                        )}
                        {results.evaporationFluid > 0 && (
                          <div className="flex justify-between">
                            <span className="text-purple-600">⚡ Evaporation:</span>
                            <span className="font-semibold">{Math.round(results.evaporationFluid)} mL/hr</span>
                          </div>
                        )}
                        {results.feverFluid > 0 && (
                          <div className="flex justify-between">
                            <span className="text-red-600">🌡️ Fever Loss:</span>
                            <span className="font-semibold">{Math.round(results.feverFluid)} mL/hr</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Hourly Breakdown */}
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white p-4">
                      <h3 className="font-bold text-lg flex items-center">
                        <Clock className="mr-2" size={20} />
                        แผนการให้สารน้ำรายชั่วโมง
                      </h3>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ชั่วโมง</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Maintenance</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Deficit</th>
                            {results.burnFluid > 0 && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Burn</th>}
                            {results.dehydrationFluid > 0 && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Dehydration</th>}
                            {results.thirdSpaceFluid > 0 && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">3rd Space</th>}
                            {results.evaporationFluid > 0 && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Evaporation</th>}
                            {results.feverFluid > 0 && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fever</th>}
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Blood Loss</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-yellow-50">รวม</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {Object.entries(results.hourlyResults).map(([hour, data]) => (
                            <tr key={hour} className="hover:bg-gray-50">
                              <td className="px-4 py-4 whitespace-nowrap font-semibold text-gray-900">ชั่วโมงที่ {hour}</td>
                              
                              {/* Maintenance */}
                              <td className="px-4 py-4 text-gray-700">
                                <div className="font-semibold">{Math.round(data.maintenance)} mL/hr</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {results.maintenanceFormula}
                                </div>
                              </td>
                              
                              {/* Deficit */}
                              <td className="px-4 py-4 text-gray-700">
                                <div className="font-semibold">{Math.round(data.deficit)} mL/hr</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {data.deficitFormula}
                                </div>
                              </td>
                              
                              {/* Burn */}
                              {results.burnFluid > 0 && (
                                <td className="px-4 py-4 text-orange-600">
                                  <div className="font-semibold">{Math.round(data.burn)} mL/hr</div>
                                  <div className="text-xs text-orange-500 mt-1">
                                    {results.burnFormula}
                                  </div>
                                </td>
                              )}
                              
                              {/* Dehydration */}
                              {results.dehydrationFluid > 0 && (
                                <td className="px-4 py-4 text-blue-600">
                                  <div className="font-semibold">{Math.round(data.dehydration)} mL/hr</div>
                                  <div className="text-xs text-blue-500 mt-1">
                                    {results.dehydrationFormula}
                                  </div>
                                </td>
                              )}
                              
                              {/* Third Space */}
                              {results.thirdSpaceFluid > 0 && (
                                <td className="px-4 py-4 text-yellow-600">
                                  <div className="font-semibold">{Math.round(data.thirdSpace)} mL/hr</div>
                                  <div className="text-xs text-yellow-500 mt-1">
                                    {results.thirdSpaceFormula}
                                  </div>
                                </td>
                              )}
                              
                              {/* Evaporation */}
                              {results.evaporationFluid > 0 && (
                                <td className="px-4 py-4 text-purple-600">
                                  <div className="font-semibold">{Math.round(data.evaporation)} mL/hr</div>
                                  <div className="text-xs text-purple-500 mt-1">
                                    {results.evaporationFormula}
                                  </div>
                                </td>
                              )}
                              
                              {/* Fever */}
                              {results.feverFluid > 0 && (
                                <td className="px-4 py-4 text-red-600">
                                  <div className="font-semibold">{Math.round(data.fever)} mL/hr</div>
                                  <div className="text-xs text-red-500 mt-1">
                                    {results.feverFormula}
                                  </div>
                                </td>
                              )}
                              
                              {/* Blood Loss */}
                              <td className="px-4 py-4 text-red-600">
                                <div className="font-semibold">{Math.round(data.bloodLoss)} mL/hr</div>
                                <div className="text-xs text-red-500 mt-1">
                                  {data.bloodLossFormula}
                                </div>
                              </td>
                              
                              {/* Total */}
                              <td className="px-4 py-4 font-bold text-lg bg-yellow-50">
                                <div className="text-green-700">{Math.round(data.total)} mL/hr</div>
                                <div className="text-xs text-gray-500 mt-1 font-normal">
                                  {Math.round(data.maintenance)}+{Math.round(data.deficit)}
                                  {data.burn > 0 && `+${Math.round(data.burn)}`}
                                  {data.dehydration > 0 && `+${Math.round(data.dehydration)}`}
                                  {data.thirdSpace > 0 && `+${Math.round(data.thirdSpace)}`}
                                  {data.evaporation > 0 && `+${Math.round(data.evaporation)}`}
                                  {data.fever > 0 && `+${Math.round(data.fever)}`}
                                  {data.bloodLoss > 0 && `+${Math.round(data.bloodLoss)}`}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Clinical Notes */}
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mt-6">
                    <h3 className="font-semibold text-yellow-800 mb-2 flex items-center">
                      <Info className="mr-2" size={16} />
                      หมายเหตุทางคลินิก
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-yellow-700 mb-2">📋 สูตรที่ใช้ในการคำนวณ:</h4>
                        <ul className="text-sm text-yellow-700 space-y-1 ml-4">
                          <li>• <span className="font-semibold">Maintenance Fluid:</span> Holliday-Segar Method (4-2-1 Rule)</li>
                          <li>• <span className="font-semibold">Deficit Replacement:</span> 4-2-1 Rule Distribution (50%-25%-25%)</li>
                          <li>• <span className="font-semibold">Blood Loss Replacement:</span> 3:1 Crystalloid Replacement Rule</li>
                          <li>• <span className="font-semibold">Burn Fluid:</span> Modified Parkland Formula for Pediatrics</li>
                          <li>• <span className="font-semibold">Dehydration Correction:</span> Pediatric Dehydration Protocol</li>
                          <li>• <span className="font-semibold">Third Space Loss:</span> Surgical Complexity-based Calculation</li>
                          <li>• <span className="font-semibold">Evaporation Loss:</span> Surgical Exposure-based Method</li>
                          <li>• <span className="font-semibold">Fever Loss:</span> 10% per °C above 37°C Rule</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-yellow-700 mb-2">📚 Evidence-based References:</h4>
                        <ul className="text-xs text-yellow-600 space-y-1 ml-4">
                          <li>• <span className="font-semibold">JPPT 2024</span> - Management of Pediatric Parenteral Fluids</li>
                          <li>• <span className="font-semibold">Best Practice & Research Clinical Anaesthesiology 2024</span> - Update on perioperative fluids</li>
                          <li>• <span className="font-semibold">Korean J Anesthesiol 2023</span> - Pediatric perioperative fluid management</li>
                          <li>• <span className="font-semibold">Saudi J Anaesth 2021</span> - Pediatric perioperative fluid management</li>
                          <li>• <span className="font-semibold">J Intensive Care 2016</span> - Fluid therapy in the perioperative setting</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 text-center">
                  <div className="text-6xl mb-4">🌈</div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">พร้อมที่จะคำนวณแล้ว!</h3>
                  <p className="text-gray-500">กรอกข้อมูลเจ้าตัวน้อยให้ครบแล้วกดคำนวณเลยจ้า</p>
                  <div className="mt-4 text-4xl animate-bounce">💧</div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center text-sm text-gray-500 border-t border-pink-200 pt-6">
            <p className="flex items-center justify-center space-x-2 mb-2">
              <Heart className="text-pink-400" size={16} />
              <span>Little Drops - ลิตเติ้ล ดรอปส์</span>
              <Heart className="text-pink-400" size={16} />
            </p>
            <p>เครื่องคำนวณสารน้ำสำหรับเด็กระหว่างผ่าตัด</p>
            <p className="text-pink-500 font-medium mt-1">ด้วยความรักและห่วงใย จากทีมวิสัญญี โรงพยาบาลศูนย์สกลนคร</p>
            
            <div className="mt-4 bg-gray-50 p-3 rounded-lg border">
              <h4 className="font-semibold text-gray-700 mb-2 text-xs">📚 Evidence-based References (สำคัญสูงสุด):</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p>• <span className="font-semibold">JPPT 2024</span> - Management of Pediatric Parenteral Fluids</p>
                <p>• <span className="font-semibold">Best Practice & Research Clinical Anaesthesiology 2024</span> - Update on perioperative fluids</p>
                <p>• <span className="font-semibold">Korean J Anesthesiol 2023</span> - Pediatric perioperative fluid management</p>
                <p>• <span className="font-semibold">Saudi J Anaesth 2021</span> - Pediatric perioperative fluid management</p>
                <p>• <span className="font-semibold">J Intensive Care 2016</span> - Fluid therapy in the perioperative setting</p>
                <p>• <span className="font-semibold">Intensive Care Med Paediatr Neonatal 2024</span> - Global survey PICU fluid practices</p>
              </div>
            </div>
            
            <p className="mt-3 text-xs">⚠️ ใช้เป็นเครื่องมือช่วยในการตัดสินใจทางคลินิกเท่านั้น กรุณาใช้วิจารณญาณทางการแพทย์ประกอบ</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LittleDropsApp;