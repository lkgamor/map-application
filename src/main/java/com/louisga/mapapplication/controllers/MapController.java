package com.louisga.mapapplication.controllers;

import com.louisga.mapapplication.config.MapConfigurations;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class MapController {
    
    private final MapConfigurations mapConfigurations;

    @GetMapping("/")
    public String getMap(Model model) {

        model.addAttribute("mapKey", mapConfigurations.getKey());
        return "map.html";
    }
}