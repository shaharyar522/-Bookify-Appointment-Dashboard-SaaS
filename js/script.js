
        // Application State Management
        const Bookify = {
            // Initialize the application
            init: function() {
                this.setupEventListeners();
                this.loadData();
                this.initCalendar();
                this.setMinDate();
                this.renderServices();
                this.renderAppointments();
            },
            
            // Data structure
            data: {
                appointments: [],
                services: [],
                availability: [],
                settings: {
                    workingHours: {
                        start: '09:00',
                        end: '17:00',
                        days: [1, 2, 3, 4, 5] // Monday to Friday
                    },
                    appointmentDuration: 30
                }
            },
            
            // Setup all event listeners
            setupEventListeners: function() {
                // Navigation
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        const view = e.target.getAttribute('data-view');
                        this.showView(view);
                        
                        // Update active class
                        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                        e.target.classList.add('active');
                    });
                });
                
                // Modal controls
                document.querySelectorAll('.modal-close, [data-modal-close]').forEach(btn => {
                    btn.addEventListener('click', () => {
                        document.querySelectorAll('.modal-overlay').forEach(modal => {
                            modal.classList.remove('active');
                        });
                    });
                });
                
                // Dashboard buttons
                document.getElementById('add-availability-btn').addEventListener('click', () => {
                    this.showModal('availability-modal');
                });
                
                document.getElementById('add-service-btn').addEventListener('click', () => {
                    this.showModal('service-modal');
                });
                
                // Availability form
                document.getElementById('save-availability').addEventListener('click', () => {
                    this.saveAvailability();
                });
                
                // Service form
                document.getElementById('save-service').addEventListener('click', () => {
                    this.saveService();
                });
                
                // Booking steps
                document.getElementById('step-1-next').addEventListener('click', () => {
                    this.nextBookingStep(1);
                });
                
                document.getElementById('step-2-back').addEventListener('click', () => {
                    this.prevBookingStep(2);
                });
                
                document.getElementById('step-2-next').addEventListener('click', () => {
                    this.nextBookingStep(2);
                });
                
                document.getElementById('step-3-back').addEventListener('click', () => {
                    this.prevBookingStep(3);
                });
                
                document.getElementById('step-3-next').addEventListener('click', () => {
                    this.bookAppointment();
                });
                
                document.getElementById('book-another').addEventListener('click', () => {
                    this.resetBooking();
                });
                
                // Date selection for booking
                document.getElementById('booking-date').addEventListener('change', (e) => {
                    this.showAvailableTimeSlots(e.target.value);
                });
                
                // Appointment filters
                document.getElementById('apply-filters').addEventListener('click', () => {
                    this.renderAppointments();
                });
                
                // Appointment actions
                document.getElementById('send-email-btn').addEventListener('click', () => {
                    this.showModal('email-modal');
                    this.populateEmail();
                });
                
                document.getElementById('confirm-appointment').addEventListener('click', () => {
                    this.updateAppointmentStatus('confirmed');
                });
                
                document.getElementById('cancel-appointment').addEventListener('click', () => {
                    this.updateAppointmentStatus('cancelled');
                });
            },
            
            // View management
            showView: function(viewId) {
                // Hide all views
                document.querySelectorAll('.view').forEach(view => {
                    view.classList.remove('active');
                });
                
                // Show the selected view
                document.getElementById(viewId).classList.add('active');
                
                // If showing appointments view, refresh the list
                if (viewId === 'appointments') {
                    this.renderAppointments();
                }
                
                // If showing dashboard, refresh the calendar
                if (viewId === 'dashboard') {
                    this.calendar.refetchEvents();
                }
            },
            
            // Modal management
            showModal: function(modalId) {
                document.getElementById(modalId).classList.add('active');
            },
            
            // Data persistence
            loadData: function() {
                // Load data from localStorage or use defaults
                const savedData = localStorage.getItem('bookify_data');
                
                if (savedData) {
                    this.data = JSON.parse(savedData);
                } else {
                    // Initialize with sample data
                    this.data.services = [
                        { id: 1, name: 'Dental Check-up', duration: 30, price: 50, description: 'Routine dental examination' },
                        { id: 2, name: 'Teeth Cleaning', duration: 45, price: 75, description: 'Professional teeth cleaning' },
                        { id: 3, name: 'Haircut', duration: 30, price: 25, description: 'Standard haircut' },
                        { id: 4, name: 'Consultation', duration: 60, price: 100, description: 'Professional consultation' }
                    ];
                    
                    this.data.appointments = [
                        { 
                            id: 1, 
                            serviceId: 1, 
                            clientName: 'John Doe', 
                            clientEmail: 'john@example.com', 
                            clientPhone: '555-1234', 
                            date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0], 
                            time: '10:00', 
                            status: 'confirmed',
                            notes: 'Routine checkup'
                        },
                        { 
                            id: 2, 
                            serviceId: 2, 
                            clientName: 'Jane Smith', 
                            clientEmail: 'jane@example.com', 
                            clientPhone: '555-5678', 
                            date: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().split('T')[0], 
                            time: '14:30', 
                            status: 'pending',
                            notes: ''
                        }
                    ];
                    
                    this.saveData();
                }
            },
            
            saveData: function() {
                localStorage.setItem('bookify_data', JSON.stringify(this.data));
            },
            
            // Calendar initialization
            initCalendar: function() {
                const calendarEl = document.getElementById('calendar');
                
                this.calendar = new FullCalendar.Calendar(calendarEl, {
                    initialView: 'timeGridWeek',
                    headerToolbar: {
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    },
                    events: this.getCalendarEvents.bind(this),
                    dateClick: this.handleDateClick.bind(this),
                    eventClick: this.handleEventClick.bind(this),
                    businessHours: {
                        daysOfWeek: this.data.settings.workingHours.days,
                        startTime: this.data.settings.workingHours.start,
                        endTime: this.data.settings.workingHours.end
                    },
                    slotDuration: '00:15:00',
                    slotMinTime: '08:00:00',
                    slotMaxTime: '18:00:00',
                    allDaySlot: false,
                    nowIndicator: true,
                    editable: true,
                    eventDrop: this.handleEventDrop.bind(this)
                });
                
                this.calendar.render();
            },
            
            getCalendarEvents: function(info, successCallback, failureCallback) {
                const events = this.data.appointments.map(appointment => {
                    const service = this.data.services.find(s => s.id === appointment.serviceId);
                    
                    return {
                        id: appointment.id,
                        title: `${appointment.clientName} - ${service ? service.name : 'Unknown Service'}`,
                        start: `${appointment.date}T${appointment.time}:00`,
                        extendedProps: {
                            status: appointment.status
                        },
                        backgroundColor: this.getStatusColor(appointment.status),
                        borderColor: this.getStatusColor(appointment.status)
                    };
                });
                
                successCallback(events);
            },
            
            getStatusColor: function(status) {
                switch(status) {
                    case 'confirmed': return '#10b981';
                    case 'pending': return '#f59e0b';
                    case 'completed': return '#6b7280';
                    case 'cancelled': return '#ef4444';
                    default: return '#3b82f6';
                }
            },
            
            handleDateClick: function(info) {
                this.showModal('availability-modal');
                
                // Pre-fill the date if clicked on a calendar day
                document.getElementById('availability-date').value = info.dateStr;
            },
            
            handleEventClick: function(info) {
                const appointmentId = parseInt(info.event.id);
                const appointment = this.data.appointments.find(a => a.id === appointmentId);
                
                if (appointment) {
                    this.showAppointmentDetails(appointment);
                }
            },
            
            handleEventDrop: function(info) {
                const appointmentId = parseInt(info.event.id);
                const appointment = this.data.appointments.find(a => a.id === appointmentId);
                
                if (appointment) {
                    const newDate = info.event.start.toISOString().split('T')[0];
                    const newTime = info.event.start.toTimeString().split(' ')[0].substring(0, 5);
                    
                    // Check if the new slot is available
                    if (this.isSlotAvailable(newDate, newTime, appointment.serviceId, appointmentId)) {
                        appointment.date = newDate;
                        appointment.time = newTime;
                        
                        this.saveData();
                        this.showToast('Appointment rescheduled successfully!', 'success');
                    } else {
                        // Revert the event position if slot is not available
                        info.revert();
                        this.showToast('This time slot is not available.', 'error');
                    }
                }
            },
            
            // Availability management
            saveAvailability: function() {
                const date = document.getElementById('availability-date').value;
                const startTime = document.getElementById('start-time').value;
                const endTime = document.getElementById('end-time').value;
                const isRecurring = document.getElementById('recurring').checked;
                
                if (!date || !startTime || !endTime) {
                    this.showToast('Please fill all fields.', 'error');
                    return;
                }
                
                const availability = {
                    date: isRecurring ? null : date,
                    startTime,
                    endTime,
                    dayOfWeek: isRecurring ? new Date(date).getDay() : null
                };
                
                this.data.availability.push(availability);
                this.saveData();
                
                this.showToast('Availability saved successfully!', 'success');
                document.querySelector('#availability-modal .modal-close').click();
            },
            
            // Service management
            saveService: function() {
                const name = document.getElementById('service-name').value;
                const duration = parseInt(document.getElementById('service-duration').value);
                const price = parseFloat(document.getElementById('service-price').value);
                const description = document.getElementById('service-description').value;
                
                if (!name || !duration) {
                    this.showToast('Please fill all required fields.', 'error');
                    return;
                }
                
                const newId = this.data.services.length > 0 
                    ? Math.max(...this.data.services.map(s => s.id)) + 1 
                    : 1;
                
                const service = {
                    id: newId,
                    name,
                    duration,
                    price,
                    description
                };
                
                this.data.services.push(service);
                this.saveData();
                
                this.renderServices();
                
                this.showToast('Service saved successfully!', 'success');
                document.querySelector('#service-modal .modal-close').click();
            },
            
            renderServices: function() {
                const servicesList = document.getElementById('services-list');
                const serviceCards = document.getElementById('service-cards');
                
                servicesList.innerHTML = '';
                serviceCards.innerHTML = '';
                
                this.data.services.forEach(service => {
                    // For admin view
                    const serviceItem = document.createElement('div');
                    serviceItem.className = 'service-item';
                    serviceItem.innerHTML = `
                        <div class="service-info">
                            <h3>${service.name}</h3>
                            <p>${service.duration} mins • $${service.price.toFixed(2)}</p>
                        </div>
                        <div class="service-actions">
                            <button class="btn btn-outline btn-sm" data-service-id="${service.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-error btn-sm" data-service-id="${service.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                    servicesList.appendChild(serviceItem);
                    
                    // For client booking view
                    const serviceCard = document.createElement('div');
                    serviceCard.className = 'service-card';
                    serviceCard.setAttribute('data-service-id', service.id);
                    serviceCard.innerHTML = `
                        <div class="service-icon">
                            <i class="fas fa-calendar-check"></i>
                        </div>
                        <h3>${service.name}</h3>
                        <p>${service.duration} minutes</p>
                        <p><strong>$${service.price.toFixed(2)}</strong></p>
                    `;
                    serviceCard.addEventListener('click', () => {
                        document.querySelectorAll('.service-card').forEach(card => {
                            card.classList.remove('selected');
                        });
                        serviceCard.classList.add('selected');
                        this.selectedService = service.id;
                    });
                    serviceCards.appendChild(serviceCard);
                });
                
                // Add event listeners for service actions
                servicesList.querySelectorAll('.btn-outline').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        // Edit service functionality would go here
                        this.showToast('Edit feature coming soon!', 'info');
                    });
                });
                
                servicesList.querySelectorAll('.btn-error').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const serviceId = parseInt(e.target.closest('button').getAttribute('data-service-id'));
                        this.deleteService(serviceId);
                    });
                });
            },
            
            deleteService: function(serviceId) {
                if (confirm('Are you sure you want to delete this service?')) {
                    this.data.services = this.data.services.filter(s => s.id !== serviceId);
                    this.saveData();
                    this.renderServices();
                    this.showToast('Service deleted successfully!', 'success');
                }
            },
            
            // Booking process
            nextBookingStep: function(currentStep) {
                // Validate current step before proceeding
                if (currentStep === 1 && !this.selectedService) {
                    this.showToast('Please select a service.', 'error');
                    return;
                }
                
                if (currentStep === 2 && (!this.selectedDate || !this.selectedTime)) {
                    this.showToast('Please select a date and time.', 'error');
                    return;
                }
                
                document.querySelector(`.step[data-step="${currentStep}"]`).classList.remove('active');
                document.querySelector(`.step[data-step="${currentStep + 1}"]`).classList.add('active');
                
                document.getElementById(`booking-step-${currentStep}`).style.display = 'none';
                document.getElementById(`booking-step-${currentStep + 1}`).style.display = 'block';
                
                // If moving to step 4, show the booking summary
                if (currentStep === 3) {
                    this.showBookingSummary();
                }
            },
            
            prevBookingStep: function(currentStep) {
                document.querySelector(`.step[data-step="${currentStep}"]`).classList.remove('active');
                document.querySelector(`.step[data-step="${currentStep - 1}"]`).classList.add('active');
                
                document.getElementById(`booking-step-${currentStep}`).style.display = 'none';
                document.getElementById(`booking-step-${currentStep - 1}`).style.display = 'block';
            },
            
            setMinDate: function() {
                const today = new Date();
                const yyyy = today.getFullYear();
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const dd = String(today.getDate()).padStart(2, '0');
                
                document.getElementById('booking-date').min = `${yyyy}-${mm}-${dd}`;
            },
            
            showAvailableTimeSlots: function(date) {
                this.selectedDate = date;
                const timeSlotsContainer = document.getElementById('time-slots');
                timeSlotsContainer.innerHTML = '';
                
                const service = this.data.services.find(s => s.id === this.selectedService);
                if (!service) return;
                
                const availableSlots = this.calculateAvailableSlots(date, service.duration);
                
                if (availableSlots.length === 0) {
                    timeSlotsContainer.innerHTML = '<p>No available time slots for this date.</p>';
                    return;
                }
                
                availableSlots.forEach(slot => {
                    const slotElement = document.createElement('div');
                    slotElement.className = 'time-slot';
                    slotElement.textContent = slot;
                    slotElement.setAttribute('data-time', slot);
                    
                    slotElement.addEventListener('click', () => {
                        document.querySelectorAll('.time-slot').forEach(s => {
                            s.classList.remove('selected');
                        });
                        slotElement.classList.add('selected');
                        this.selectedTime = slot;
                    });
                    
                    timeSlotsContainer.appendChild(slotElement);
                });
            },
            
            calculateAvailableSlots: function(date, duration) {
                // This is a simplified implementation
                // A real implementation would consider:
                // 1. Working hours
                // 2. Existing appointments
                // 3. Breaks and time off
                
                const slots = [];
                const startHour = 9; // 9 AM
                const endHour = 17; // 5 PM
                const interval = duration / 60; // Convert to hours
                
                for (let hour = startHour; hour < endHour; hour += interval) {
                    for (let minute = 0; minute < 60; minute += 30) {
                        if (hour + (minute / 60) + interval > endHour) break;
                        
                        const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                        
                        // Check if this slot is already booked
                        const isBooked = this.data.appointments.some(appointment => {
                            return appointment.date === date && appointment.time === timeString;
                        });
                        
                        if (!isBooked) {
                            slots.push(timeString);
                        }
                    }
                }
                
                return slots;
            },
            
            isSlotAvailable: function(date, time, serviceId, excludeAppointmentId = null) {
                // Check if the slot is available for booking
                const service = this.data.services.find(s => s.id === serviceId);
                if (!service) return false;
                
                // Check for overlapping appointments
                const overlappingAppointment = this.data.appointments.find(appointment => {
                    if (appointment.id === excludeAppointmentId) return false;
                    if (appointment.date !== date) return false;
                    
                    const appointmentTime = new Date(`${date}T${appointment.time}:00`);
                    const newAppointmentTime = new Date(`${date}T${time}:00`);
                    const appointmentEndTime = new Date(appointmentTime.getTime() + (service.duration * 60000));
                    const newAppointmentEndTime = new Date(newAppointmentTime.getTime() + (service.duration * 60000));
                    
                    return (
                        (newAppointmentTime >= appointmentTime && newAppointmentTime < appointmentEndTime) ||
                        (newAppointmentEndTime > appointmentTime && newAppointmentEndTime <= appointmentEndTime) ||
                        (newAppointmentTime <= appointmentTime && newAppointmentEndTime >= appointmentEndTime)
                    );
                });
                
                return !overlappingAppointment;
            },
            
            bookAppointment: function() {
                // Validate form
                const form = document.getElementById('client-info-form');
                if (!form.checkValidity()) {
                    form.reportValidity();
                    return;
                }
                
                const clientName = document.getElementById('client-name').value;
                const clientEmail = document.getElementById('client-email').value;
                const clientPhone = document.getElementById('client-phone').value;
                const clientNotes = document.getElementById('client-notes').value;
                
                // Create new appointment
                const newId = this.data.appointments.length > 0 
                    ? Math.max(...this.data.appointments.map(a => a.id)) + 1 
                    : 1;
                
                const appointment = {
                    id: newId,
                    serviceId: this.selectedService,
                    clientName,
                    clientEmail,
                    clientPhone,
                    date: this.selectedDate,
                    time: this.selectedTime,
                    status: 'pending',
                    notes: clientNotes,
                    createdAt: new Date().toISOString()
                };
                
                this.data.appointments.push(appointment);
                this.saveData();
                
                // Refresh calendar if on dashboard
                if (this.calendar) {
                    this.calendar.refetchEvents();
                }
                
                // Move to confirmation step
                this.nextBookingStep(3);
            },
            
            showBookingSummary: function() {
                const service = this.data.services.find(s => s.id === this.selectedService);
                const summaryContainer = document.getElementById('booking-summary');
                
                if (!service) return;
                
                summaryContainer.innerHTML = `
                    <p><strong>Service:</strong> ${service.name}</p>
                    <p><strong>Date:</strong> ${new Date(this.selectedDate).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> ${this.selectedTime}</p>
                    <p><strong>Duration:</strong> ${service.duration} minutes</p>
                    <p><strong>Price:</strong> $${service.price.toFixed(2)}</p>
                    <p><strong>Client:</strong> ${document.getElementById('client-name').value}</p>
                    <p><strong>Email:</strong> ${document.getElementById('client-email').value}</p>
                    <p><strong>Phone:</strong> ${document.getElementById('client-phone').value}</p>
                `;
            },
            
            resetBooking: function() {
                // Reset all booking fields and go back to step 1
                this.selectedService = null;
                this.selectedDate = null;
                this.selectedTime = null;
                
                document.querySelectorAll('.service-card').forEach(card => {
                    card.classList.remove('selected');
                });
                
                document.getElementById('booking-date').value = '';
                document.getElementById('time-slots').innerHTML = '';
                document.getElementById('client-info-form').reset();
                
                document.querySelectorAll('.step').forEach((step, index) => {
                    step.classList.remove('active', 'completed');
                    if (index === 0) step.classList.add('active');
                });
                
                document.querySelectorAll('.booking-step').forEach((step, index) => {
                    step.style.display = index === 0 ? 'block' : 'none';
                });
            },
            
            // Appointments management
            renderAppointments: function() {
                const tbody = document.getElementById('appointments-table-body');
                tbody.innerHTML = '';
                
                const statusFilter = document.getElementById('status-filter').value;
                const dateFrom = document.getElementById('date-from').value;
                const dateTo = document.getElementById('date-to').value;
                
                let filteredAppointments = this.data.appointments;
                
                // Apply status filter
                if (statusFilter !== 'all') {
                    filteredAppointments = filteredAppointments.filter(a => a.status === statusFilter);
                }
                
                // Apply date range filter
                if (dateFrom) {
                    filteredAppointments = filteredAppointments.filter(a => a.date >= dateFrom);
                }
                
                if (dateTo) {
                    filteredAppointments = filteredAppointments.filter(a => a.date <= dateTo);
                }
                
                // Sort appointments by date and time (newest first)
                filteredAppointments.sort((a, b) => {
                    const dateA = new Date(`${a.date}T${a.time}:00`);
                    const dateB = new Date(`${b.date}T${b.time}:00`);
                    return dateB - dateA;
                });
                
                if (filteredAppointments.length === 0) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="6" style="text-align: center; padding: 2rem;">
                                No appointments found matching your criteria.
                            </td>
                        </tr>
                    `;
                    return;
                }
                
                filteredAppointments.forEach(appointment => {
                    const service = this.data.services.find(s => s.id === appointment.serviceId);
                    const row = document.createElement('tr');
                    
                    row.innerHTML = `
                        <td>${new Date(appointment.date).toLocaleDateString()}</td>
                        <td>${appointment.time}</td>
                        <td>${appointment.clientName}</td>
                        <td>${service ? service.name : 'Unknown Service'}</td>
                        <td><span class="status-badge status-${appointment.status}">${appointment.status}</span></td>
                        <td>
                            <button class="btn btn-outline btn-sm view-appointment" data-appointment-id="${appointment.id}">
                                <i class="fas fa-eye"></i> View
                            </button>
                        </td>
                    `;
                    
                    tbody.appendChild(row);
                });
                
                // Add event listeners to view buttons
                tbody.querySelectorAll('.view-appointment').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const appointmentId = parseInt(e.target.closest('button').getAttribute('data-appointment-id'));
                        const appointment = this.data.appointments.find(a => a.id === appointmentId);
                        
                        if (appointment) {
                            this.showAppointmentDetails(appointment);
                        }
                    });
                });
            },
            
            showAppointmentDetails: function(appointment) {
                const detailsContainer = document.getElementById('appointment-details');
                const service = this.data.services.find(s => s.id === appointment.serviceId);
                
                detailsContainer.innerHTML = `
                    <div class="form-group">
                        <label>Client Name</label>
                        <p>${appointment.clientName}</p>
                    </div>
                    <div class="form-group">
                        <label>Contact Information</label>
                        <p>Email: ${appointment.clientEmail}</p>
                        <p>Phone: ${appointment.clientPhone}</p>
                    </div>
                    <div class="form-group">
                        <label>Appointment Details</label>
                        <p>Service: ${service ? service.name : 'Unknown Service'}</p>
                        <p>Date: ${new Date(appointment.date).toLocaleDateString()}</p>
                        <p>Time: ${appointment.time}</p>
                        <p>Duration: ${service ? service.duration + ' minutes' : 'N/A'}</p>
                        <p>Status: <span class="status-badge status-${appointment.status}">${appointment.status}</span></p>
                    </div>
                    <div class="form-group">
                        <label>Notes</label>
                        <p>${appointment.notes || 'No notes provided.'}</p>
                    </div>
                `;
                
                // Show/hide action buttons based on status
                document.getElementById('confirm-appointment').style.display = appointment.status === 'pending' ? 'block' : 'none';
                document.getElementById('cancel-appointment').style.display = appointment.status !== 'cancelled' && appointment.status !== 'completed' ? 'block' : 'none';
                document.getElementById('reschedule-appointment').style.display = appointment.status !== 'cancelled' && appointment.status !== 'completed' ? 'block' : 'none';
                
                // Store current appointment for actions
                this.currentAppointment = appointment;
                
                this.showModal('appointment-modal');
            },
            
            updateAppointmentStatus: function(status) {
                if (!this.currentAppointment) return;
                
                this.currentAppointment.status = status;
                this.saveData();
                
                // Refresh views
                this.calendar.refetchEvents();
                this.renderAppointments();
                
                this.showToast(`Appointment ${status} successfully!`, 'success');
                document.querySelector('#appointment-modal .modal-close').click();
            },
            
            populateEmail: function() {
                if (!this.currentAppointment) return;
                
                const service = this.data.services.find(s => s.id === this.currentAppointment.serviceId);
                
                document.getElementById('email-client-name').textContent = this.currentAppointment.clientName;
                document.getElementById('email-service').textContent = service ? service.name : 'Unknown Service';
                document.getElementById('email-datetime').textContent = 
                    `${new Date(this.currentAppointment.date).toLocaleDateString()} at ${this.currentAppointment.time}`;
                document.getElementById('email-duration').textContent = service ? service.duration : 'N/A';
            },
            
            // Utility functions
            showToast: function(message, type = 'info') {
                const toastContainer = document.querySelector('.toast-container');
                if (!toastContainer) {
                    // Create toast container if it doesn't exist
                    const container = document.createElement('div');
                    container.className = 'toast-container';
                    document.body.appendChild(container);
                }
                
                const toast = document.createElement('div');
                toast.className = `toast toast-${type}`;
                
                const icon = {
                    success: 'check-circle',
                    error: 'exclamation-circle',
                    warning: 'exclamation-triangle',
                    info: 'info-circle'
                }[type];
                
                toast.innerHTML = `
                    <div class="toast-icon">
                        <i class="fas fa-${icon}"></i>
                    </div>
                    <div class="toast-content">
                        <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                        <div class="toast-message">${message}</div>
                    </div>
                `;
                
                document.querySelector('.toast-container').appendChild(toast);
                
                // Remove toast after animation
                setTimeout(() => {
                    toast.remove();
                }, 3000);
            }
        };

        // Initialize the application when the DOM is loaded
        document.addEventListener('DOMContentLoaded', function() {
            Bookify.init();
        });


        //responisve
  
// Add this to your existing JavaScript to handle mobile navigation
document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.createElement('button');
    navToggle.className = 'nav-toggle';
    navToggle.innerHTML = '<i class="fas fa-bars"></i>';
    
    const headerContent = document.querySelector('.header-content');
    if (headerContent) {
        headerContent.appendChild(navToggle);
        
        const nav = document.querySelector('nav ul');
        navToggle.addEventListener('click', function() {
            nav.classList.toggle('active');
        });
        
        // Close menu when clicking on a link
        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', function() {
                nav.classList.remove('active');
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('nav') && !e.target.closest('.nav-toggle')) {
                nav.classList.remove('active');
            }
        });
    }
});