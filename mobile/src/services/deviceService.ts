import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/constants.js';
import { Device, DeviceType, DevicesResponse, DeviceFilter, Laptop, Monitor, Printer, Projector, Tool } from '../types/devices';

class DeviceService {
  private async getAuthHeaders() {
    const token = await AsyncStorage.getItem('authToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  // Get laptops with pagination
  async getLaptops(page: number = 1, limit: number = 20): Promise<{ devices: Laptop[], pagination: any }> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/laptops?page=${page}&limit=${limit}`, { headers });

    if (!response.ok) {
      throw new Error('Failed to fetch laptops');
    }

    const data = await response.json();
    return {
      devices: data.populatedLaptops || [],
      pagination: data.pagination || {}
    };
  }

  // Get monitors with pagination
  async getMonitors(page: number = 1, limit: number = 20): Promise<{ devices: Monitor[], pagination: any }> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/monitors?page=${page}&limit=${limit}`, { headers });

    if (!response.ok) {
      throw new Error('Failed to fetch monitors');
    }

    const data = await response.json();
    return {
      devices: data.populatedMonitors || [],
      pagination: data.pagination || {}
    };
  }

  // Get printers with pagination
  async getPrinters(page: number = 1, limit: number = 20): Promise<{ devices: Printer[], pagination: any }> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/printers?page=${page}&limit=${limit}`, { headers });

    if (!response.ok) {
      throw new Error('Failed to fetch printers');
    }

    const data = await response.json();
    return {
      devices: data.populatedPrinters || [],
      pagination: data.pagination || {}
    };
  }

  // Get projectors with pagination
  async getProjectors(page: number = 1, limit: number = 20): Promise<{ devices: Projector[], pagination: any }> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/projectors?page=${page}&limit=${limit}`, { headers });

    if (!response.ok) {
      throw new Error('Failed to fetch projectors');
    }

    const data = await response.json();
    return {
      devices: data.populatedProjectors || [],
      pagination: data.pagination || {}
    };
  }

  // Get tools with pagination
  async getTools(page: number = 1, limit: number = 20): Promise<{ devices: Tool[], pagination: any }> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/tools?page=${page}&limit=${limit}`, { headers });

    if (!response.ok) {
      throw new Error('Failed to fetch tools');
    }

    const data = await response.json();
    return {
      devices: data.populatedTools || [],
      pagination: data.pagination || {}
    };
  }

  // Get devices by type with pagination
  async getDevicesByType(deviceType: DeviceType, page: number = 1, limit: number = 20): Promise<{ devices: Device[], pagination: any }> {
    switch (deviceType) {
      case 'laptop':
        return await this.getLaptops(page, limit);
      case 'monitor':
        return await this.getMonitors(page, limit);
      case 'printer':
        return await this.getPrinters(page, limit);
      case 'projector':
        return await this.getProjectors(page, limit);
      case 'tool':
        return await this.getTools(page, limit);
      default:
        return { devices: [], pagination: {} };
    }
  }

  // Get all devices (for backward compatibility - gets first page only)
  async getAllDevices(): Promise<Device[]> {
    try {
      const [laptops, monitors, printers, projectors, tools] = await Promise.all([
        this.getLaptops(1, 100),
        this.getMonitors(1, 100),
        this.getPrinters(1, 100),
        this.getProjectors(1, 100),
        this.getTools(1, 100)
      ]);

      return [...laptops.devices, ...monitors.devices, ...printers.devices, ...projectors.devices, ...tools.devices];
    } catch (error) {
      console.error('Error fetching all devices:', error);
      throw error;
    }
  }

  // Filter devices locally
  filterDevices(devices: Device[], filter: DeviceFilter): Device[] {
    return devices.filter(device => {
      // Search filter
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        const matchesSearch = 
          device.name.toLowerCase().includes(searchLower) ||
          device.serial.toLowerCase().includes(searchLower) ||
          (device.manufacturer && device.manufacturer.toLowerCase().includes(searchLower)) ||
          device.assigned.some(user => user.fullname.toLowerCase().includes(searchLower)) ||
          (device.room && device.room.name.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filter.status && device.status !== filter.status) {
        return false;
      }

      // Manufacturer filter
      if (filter.manufacturer && device.manufacturer !== filter.manufacturer) {
        return false;
      }

      // Room filter
      if (filter.room && (!device.room || device.room.name !== filter.room)) {
        return false;
      }

      // Assigned filter
      if (filter.assigned !== undefined) {
        const isAssigned = device.assigned.length > 0;
        if (filter.assigned !== isAssigned) {
          return false;
        }
      }

      return true;
    });
  }

  // Get filter options for a specific device type
  async getFilterOptions(deviceType: DeviceType): Promise<{
    statuses: string[],
    types: string[],
    manufacturers: string[],
    departments: string[],
    yearRange: [number, number]
  }> {
    const headers = await this.getAuthHeaders();
    let endpoint = '';
    
    switch (deviceType) {
      case 'laptop':
        endpoint = '/api/laptops/filter-options';
        break;
      case 'monitor':
        endpoint = '/api/monitors/filter-options';
        break;
      case 'printer':
        endpoint = '/api/printers/filter-options';
        break;
      case 'projector':
        endpoint = '/api/projectors/filter-options';
        break;
      case 'tool':
        endpoint = '/api/tools/filter-options';
        break;
      default:
        return {
          statuses: [],
          types: [],
          manufacturers: [],
          departments: [],
          yearRange: [2015, 2024]
        };
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, { headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch filter options for ${deviceType}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching filter options:', error);
      // Return fallback data if API fails
      return {
        statuses: ['Active', 'Standby', 'Broken', 'PendingDocumentation'],
        types: [],
        manufacturers: [],
        departments: [],
        yearRange: [2015, 2024]
      };
    }
  }

  // Get device by ID
  async getDeviceById(deviceType: DeviceType, id: string): Promise<Device | null> {
    const headers = await this.getAuthHeaders();
    let endpoint = '';
    
    switch (deviceType) {
      case 'laptop':
        endpoint = `/api/laptops/${id}`;
        break;
      case 'monitor':
        endpoint = `/api/monitors/${id}`;
        break;
      case 'printer':
        endpoint = `/api/printers/${id}`;
        break;
      case 'projector':
        endpoint = `/api/projectors/${id}`;
        break;
      case 'tool':
        endpoint = `/api/tools/${id}`;
        break;
      default:
        return null;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, { headers });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${deviceType}`);
    }

    const data = await response.json();
    return data;
  }
}

export default new DeviceService(); 