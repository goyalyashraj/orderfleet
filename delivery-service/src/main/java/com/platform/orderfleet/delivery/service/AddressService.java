package com.platform.orderfleet.delivery.service;

import com.platform.orderfleet.delivery.dto.AddressResponse;
import com.platform.orderfleet.delivery.dto.CreateAddressRequest;
import com.platform.orderfleet.delivery.entity.Address;
import com.platform.orderfleet.delivery.exception.ResourceNotFoundException;
import com.platform.orderfleet.delivery.repository.AddressRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AddressService {

    private static final Logger log = LoggerFactory.getLogger(AddressService.class);

    private final AddressRepository addressRepository;

    public AddressService(AddressRepository addressRepository) {
        this.addressRepository = addressRepository;
    }

    @Transactional
    public AddressResponse createAddress(Long userId, CreateAddressRequest request) {
        log.info("Persisting delivery address for user: {}", userId);

        if (request.isDefault()) {
            addressRepository.findByUserIdOrderByCreatedAtDesc(userId).forEach(addr -> {
                if (addr.isDefault()) {
                    addr.setDefault(false);
                    addressRepository.save(addr);
                }
            });
        }

        Address address = new Address(
                userId,
                request.recipientName().trim(),
                request.phone().trim(),
                request.streetLine().trim(),
                request.city().trim(),
                request.state().trim(),
                request.postalCode().trim(),
                request.latitude(),
                request.longitude(),
                request.isDefault()
        );

        Address saved = addressRepository.save(address);
        log.info("Address created with ID: {} for user: {}", saved.getId(), userId);

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<AddressResponse> getUserAddresses(Long userId) {
        return addressRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public Address getAddressEntityById(Long id, Long userId) {
        return addressRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found with ID: " + id));
    }

    private AddressResponse mapToResponse(Address a) {
        return new AddressResponse(
                a.getId(),
                a.getUserId(),
                a.getRecipientName(),
                a.getPhone(),
                a.getStreetLine(),
                a.getCity(),
                a.getState(),
                a.getPostalCode(),
                a.getLatitude(),
                a.getLongitude(),
                a.isDefault(),
                a.getCreatedAt()
        );
    }
}
