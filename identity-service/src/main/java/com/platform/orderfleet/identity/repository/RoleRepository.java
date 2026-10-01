package com.platform.orderfleet.identity.repository;

import com.platform.orderfleet.common.enums.RoleType;
import com.platform.orderfleet.identity.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(RoleType name);
}
