import React, { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { User, CheckCircle, X, Clock } from 'lucide-react';

const SeatSelector = ({ 
  selectedSeat, 
  selectedSlot = 'full-day',
  onSeatSelect, 
  onSlotSelect,
  excludeUserId = null,
  disabled = false,
  availableSlots = []
}) => {
  const [seatData, setSeatData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSeatAvailability();
  }, []);

  const loadSeatAvailability = async () => {
    try {
      setLoading(true);
      const data = await userAPI.getSeatAvailability();
      setSeatData(data);
    } catch (error) {
      setError('Failed to load seat availability');
      console.error('Seat availability error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeatStatus = (seat) => {
    if (!seat.occupiedBy || Object.keys(seat.occupiedBy).length === 0) {
      return 'available';
    }

    // Check if the current student (when editing) occupies this seat
    const currentUserOccupies = excludeUserId && Object.values(seat.occupiedBy).some(
      occupant => occupant.userId === excludeUserId
    );

    if (currentUserOccupies) {
      return 'current-user';
    }

    // Check for conflicts based on selected slot
    if (selectedSlot === 'full-day') {
      // Full day needs the entire seat
      return Object.keys(seat.occupiedBy).length > 0 ? 'occupied' : 'available';
    } else {
      // Check specific slot availability
      if (seat.occupiedBy['full-day']) {
        return 'occupied'; // Can't use if someone has full day
      }
      
      if (seat.occupiedBy[selectedSlot]) {
        return 'occupied'; // Slot already taken
      }
      
      // Partial occupation in other slots
      return 'partial';
    }
  };

  const getSeatColor = (seat) => {
    const status = getSeatStatus(seat);
    
    switch (status) {
      case 'available':
        return 'bg-green-100 hover:bg-green-200 border-green-300 text-green-800';
      case 'occupied':
        return 'bg-red-100 border-red-300 text-red-800 cursor-not-allowed';
      case 'partial':
        return 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300 text-yellow-800';
      case 'current-user':
        return 'bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-600';
    }
  };

  const canSelectSeat = (seat) => {
    if (disabled) return false;
    
    const status = getSeatStatus(seat);
    return status === 'available' || status === 'partial' || status === 'current-user';
  };

  const handleSeatClick = (e, seat) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!canSelectSeat(seat)) return;
    
    onSeatSelect(seat.seatNumber === selectedSeat ? null : seat.seatNumber);
  };

  const handleSlotChange = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newSlot = e.target.value;
    if (onSlotSelect) {
      onSlotSelect(newSlot);
    }
    
    // Clear seat selection if slot changes and current seat becomes unavailable
    if (selectedSeat && newSlot !== selectedSlot) {
      const seatInfo = seatData?.seatMap.find(s => s.seatNumber === selectedSeat);
      if (seatInfo) {
        const wouldBeOccupied = newSlot === 'full-day' ? 
          Object.keys(seatInfo.occupiedBy || {}).length > 0 :
          seatInfo.occupiedBy?.['full-day'] || seatInfo.occupiedBy?.[newSlot];
          
        if (wouldBeOccupied) {
          onSeatSelect(null);
        }
      }
    }
  };

  const getSeatTooltip = (seat) => {
    const status = getSeatStatus(seat);
    const occupants = Object.values(seat.occupiedBy || {});
    
    if (status === 'available') {
      return 'Available';
    }
    
    if (status === 'current-user') {
      return 'Currently assigned to this student';
    }
    
    if (occupants.length > 0) {
      const details = occupants.map(occ => `${occ.name} (${occ.slot})`).join(', ');
      return `Occupied by: ${details}`;
    }
    
    return 'Unknown status';
  };

  const getSlotColors = () => {
    const colors = {};
    
    // Always include full-day color
    colors['full-day'] = 'bg-red-100 text-red-800';
    
    if (availableSlots.length > 0) {
      // Generate colors for dynamic slots
      const colorClasses = [
        'bg-blue-100 text-blue-800',
        'bg-orange-100 text-orange-800',
        'bg-purple-100 text-purple-800',
        'bg-green-100 text-green-800',
        'bg-pink-100 text-pink-800',
        'bg-indigo-100 text-indigo-800'
      ];
      
      availableSlots.forEach((slot, index) => {
        colors[slot.name] = colorClasses[index % colorClasses.length];
      });
    } else {
      // Fallback colors for default slots
      colors['morning'] = 'bg-blue-100 text-blue-800';
      colors['afternoon'] = 'bg-orange-100 text-orange-800';
    }
    
    // Additional color for any custom slots
    colors['custom'] = 'bg-purple-100 text-purple-800';
    
    return colors;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <X className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-800">{error}</span>
        </div>
        <button 
          onClick={loadSeatAvailability}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!seatData) {
    return <div>No seat data available</div>;
  }

  // Calculate grid dimensions
  const { totalSeats } = seatData;
  const seatsPerRow = Math.ceil(Math.sqrt(totalSeats));
  const rows = Math.ceil(totalSeats / seatsPerRow);

    return (
    <div className="space-y-4">
      {/* Slot Selection */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
          <Clock className="h-4 w-4 mr-2" />
          Select Time Slot
        </h4>
        <div className="grid grid-cols-4 gap-3">
          {[
            // Always include Full Day as the first option
            { value: 'full-day', label: 'Full Day', color: 'bg-red-100 text-red-800' },
            // Add custom slots if available
            ...(availableSlots.length > 0 ? 
              availableSlots.map((slot, index) => ({
                value: slot.name,
                label: `${slot.name} (${slot.startTime}-${slot.endTime})`,
                color: index % 3 === 0 ? 'bg-blue-100 text-blue-800' : 
                       index % 3 === 1 ? 'bg-orange-100 text-orange-800' : 
                       'bg-purple-100 text-purple-800'
              })) :
              // Fallback slots if no custom slots are configured
              [
                { value: 'morning', label: 'Morning', color: 'bg-blue-100 text-blue-800' },
                { value: 'afternoon', label: 'Afternoon', color: 'bg-orange-100 text-orange-800' }
              ]
            )
          ].map((slot) => (
            <button
              key={slot.value}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onSlotSelect) onSlotSelect(slot.value);
              }}
              className={`p-3 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${
                selectedSlot === slot.value
                  ? `${slot.color} border-current ring-2 ring-offset-2 ring-blue-500`
                  : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
              disabled={disabled}
            >
              {slot.label}
            </button>
          ))}
        </div>
        {selectedSlot && (
          <div className="mt-3 text-sm text-gray-600 flex items-center">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
            Selected: <span className="font-medium ml-1">{selectedSlot.charAt(0).toUpperCase() + selectedSlot.slice(1)}</span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Seat Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
            <span>Partially Occupied</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
            <span>Fully Occupied</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
            <span>Current Student</span>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-600">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(getSlotColors()).map(([slot, colorClass]) => (
                <div key={slot} className="flex items-center space-x-1">
                  <span className={`px-2 py-0.5 rounded text-xs ${colorClass}`}>
                    {slot.charAt(0).toUpperCase() + slot.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-600">{seatData.summary.available}</div>
          <div className="text-sm text-green-700">Available</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-yellow-600">{seatData.summary.partiallyOccupied}</div>
          <div className="text-sm text-yellow-700">Partial</div>
        </div>
        <div className="bg-red-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-red-600">{seatData.summary.occupied}</div>
          <div className="text-sm text-red-700">Occupied</div>
        </div>
      </div>

      {/* Seat Grid */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <User className="h-5 w-5 mr-2" />
          Select a Seat {selectedSlot ? `for ${selectedSlot} slot` : ''}
        </h4>
        
        {!selectedSlot && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-yellow-600 mr-2" />
              <span className="text-sm text-yellow-800">Please select a time slot first</span>
            </div>
          </div>
        )}
        
        <div 
          className="grid gap-2 mx-auto justify-center"
          style={{ 
            gridTemplateColumns: `repeat(${seatsPerRow}, minmax(0, 1fr))`,
            maxWidth: `${seatsPerRow * 3}rem`
          }}
        >
          {seatData.seatMap.map((seat) => {
            const isSelected = seat.seatNumber === selectedSeat;
            const canSelect = canSelectSeat(seat);
            const seatColor = getSeatColor(seat);
            
            return (
              <button
                key={seat.seatNumber}
                type="button"
                onClick={(e) => handleSeatClick(e, seat)}
                disabled={!canSelect || !selectedSlot}
                title={getSeatTooltip(seat)}
                className={`
                  relative w-10 h-10 rounded-lg border-2 text-xs font-medium
                  transition-all duration-200 flex items-center justify-center
                  ${seatColor}
                  ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                  ${canSelect && selectedSlot ? 'hover:scale-105 active:scale-95' : ''}
                  ${!selectedSlot ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {seat.seatNumber}
                {isSelected && (
                  <CheckCircle className="absolute -top-1 -right-1 h-4 w-4 text-blue-600 bg-white rounded-full" />
                )}
                
                {/* Slot indicators for partially occupied seats */}
                {getSeatStatus(seat) === 'partial' && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                    <div className="flex space-x-0.5">
                      {Object.keys(seat.occupiedBy || {}).map((slot, idx) => (
                        <div 
                          key={slot}
                          className={`w-1 h-1 rounded-full ${
                            slot === 'morning' ? 'bg-blue-500' :
                            slot === 'afternoon' ? 'bg-orange-500' :
                            slot === 'full-day' ? 'bg-red-500' :
                            'bg-purple-500'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
        
        {(selectedSeat || selectedSlot) && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-blue-900">
                {selectedSlot && <div>Slot: {selectedSlot.charAt(0).toUpperCase() + selectedSlot.slice(1)}</div>}
                {selectedSeat && <div>Seat: {selectedSeat}</div>}
              </div>
              <div className="flex space-x-2">
                {selectedSeat && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onSeatSelect(null);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Clear Seat
                  </button>
                )}
                {selectedSlot && onSlotSelect && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onSlotSelect(null);
                      onSeatSelect(null); // Also clear seat
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Clear Slot
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeatSelector;
